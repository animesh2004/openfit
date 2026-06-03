// Quant-aware RAM matching.
//
// People don't run models at full precision locally — they run quantized GGUFs
// via Ollama. So instead of one made-up RAM number per model, we estimate the
// real footprint at each common quant level and check what actually fits, then
// use VRAM to decide whether it runs *fast* (in GPU) or just *slow* (RAM only).

const { verifiedOllamaCommand } = require("./ollama-models");

// Bytes per weight by quant, plus a runtime overhead factor for KV cache /
// activations / context. Calibrated against real GGUF sizes.
const QUANTS = [
  { label: "Q4_K_M", bpw: 0.6 },
  { label: "Q8_0", bpw: 1.1 },
  { label: "FP16", bpw: 2.0 },
];
const OVERHEAD = 1.2;

// Pull the parameter size out of a model id/name.
// Handles Mixture-of-Experts tokens ("8x7b" -> 56B total, which is what must
// sit in memory) and plain dense tokens ("70b", "1.5b"). Returns null if not
// detectable.
function extractSize(idOrName) {
  const str = String(idOrName).toLowerCase();

  // MoE: NxM b  (all experts must be resident in RAM)
  const moe = str.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*b/);
  if (moe) {
    const n = parseInt(moe[1], 10);
    const m = parseFloat(moe[2]);
    return { paramsB: n * m, tag: `${n}x${m}b`, label: `${n}x${m}B` };
  }

  // Dense: pick the largest "<num>b" token so we don't grab a version number.
  const matches = str.match(/(\d+(?:\.\d+)?)\s*b/g);
  if (!matches) return null;
  let best = null;
  for (const mt of matches) {
    const num = parseFloat(mt);
    if (!isNaN(num) && (best === null || num > best)) best = num;
  }
  if (best === null) return null;
  return { paramsB: best, tag: `${best}b`, label: `${best}B` };
}

function requiredFor(paramsB, bpw) {
  return Math.max(1, Math.ceil(paramsB * bpw * OVERHEAD));
}

function matchModels(models, system) {
  const totalRAM = system.totalRAM;
  const vram = system.vram || 0;

  const runnable = [];
  const notRunnable = [];

  for (const model of models) {
    const id = model.id || model.name || "";
    const size = extractSize(model.name || id) || extractSize(id);
    if (!size) continue; // skip models with no detectable size

    // Footprint at each quant level.
    const quants = QUANTS.map((q) => {
      const required = requiredFor(size.paramsB, q.bpw);
      return { label: q.label, required, fitsRAM: totalRAM >= required };
    });

    // Smallest quant that fits in total RAM (Q4 first).
    const best = quants.find((q) => q.fitsRAM) || null;

    const entry = {
      id,
      sizeLabel: size.label,
      paramsB: size.paramsB,
      quants,
      best,
      have: totalRAM,
      vram,
      ollama: verifiedOllamaCommand(id, size.tag),
    };

    if (best) {
      // Runs fast if the best-fitting quant fits in VRAM; otherwise RAM-only.
      entry.speed = vram > 0 && best.required <= vram ? "fast" : "slow";
      runnable.push(entry);
    } else {
      // Nothing fits — report the gap at the lightest (Q4) quant.
      entry.missing = quants[0].required - totalRAM;
      notRunnable.push(entry);
    }
  }

  // Smallest first among runnable; smallest-deficit first among not-runnable.
  runnable.sort((a, b) => a.paramsB - b.paramsB);
  notRunnable.sort((a, b) => a.paramsB - b.paramsB);

  return { runnable, notRunnable };
}

module.exports = { matchModels, extractSize, requiredFor, QUANTS };
