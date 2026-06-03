// RAM matching logic.
//
// Extracts a parameter size from a model id/name, maps it to a required-RAM
// figure, and decides whether the system can run it.

// Exact required-RAM table from the spec (size in B -> required GB).
const RAM_TABLE = {
  3: 3,
  7: 6,
  8: 7,
  13: 10,
  14: 12,
  32: 22,
  34: 24,
  70: 48,
  72: 50,
};

// Pull the parameter size (in billions) out of a model id/name.
// Matches tokens like "3b", "70b", "1.5b". Returns the largest match so we
// don't accidentally pick a version number, and null if nothing detectable.
function extractSize(idOrName) {
  const str = String(idOrName).toLowerCase();
  const matches = str.match(/(\d+(?:\.\d+)?)\s*b/g);
  if (!matches) return null;
  let best = null;
  for (const m of matches) {
    const num = parseFloat(m);
    if (!isNaN(num) && (best === null || num > best)) best = num;
  }
  return best;
}

// Map a size in billions to required RAM in GB.
function requiredRAM(sizeB) {
  const rounded = Math.round(sizeB);
  if (RAM_TABLE[rounded] !== undefined) return RAM_TABLE[rounded];
  // Fallback for sizes not in the table: ~0.7x params, min 2GB.
  return Math.max(2, Math.round(sizeB * 0.7));
}

// Best-effort `ollama pull` command for a model id.
function buildOllamaCommand(id) {
  const slug = id.split("/").pop().split(":")[0].toLowerCase();
  const sizeTok = (slug.match(/(\d+(?:\.\d+)?)b/) || [])[0];

  const families = [
    { test: /llama-?(\d+(?:\.\d+)?)/, name: (v) => `llama${v}` },
    { test: /gemma-?(\d+)/, name: (v) => `gemma${v}` },
    { test: /qwen-?(\d+(?:\.\d+)?)/, name: (v) => `qwen${v}` },
    { test: /phi-?(\d+(?:\.\d+)?)/, name: (v) => `phi${v}` },
    { test: /mixtral/, name: () => `mixtral` },
    { test: /mistral/, name: () => `mistral` },
    { test: /deepseek/, name: () => `deepseek-r1` },
  ];

  for (const f of families) {
    const m = slug.match(f.test);
    if (m) {
      const fam = f.name(m[1]);
      return `ollama pull ${fam}${sizeTok ? ":" + sizeTok : ""}`;
    }
  }
  return `ollama pull ${slug}`;
}

function matchModels(models, system) {
  const have = system.totalRAM;
  const runnable = [];
  const notRunnable = [];

  for (const model of models) {
    const id = model.id || model.name || "";
    const sizeB = extractSize(model.name || id) || extractSize(id);

    // Skip models with no detectable size silently.
    if (sizeB === null) continue;

    const required = requiredRAM(sizeB);
    const entry = {
      id,
      sizeLabel: `${Number.isInteger(sizeB) ? sizeB : sizeB}B`,
      required,
      have,
      ollama: buildOllamaCommand(id),
    };

    if (have >= required) {
      runnable.push(entry);
    } else {
      entry.missing = required - have;
      notRunnable.push(entry);
    }
  }

  // Smaller models first in the runnable list; largest-deficit last.
  runnable.sort((a, b) => a.required - b.required);
  notRunnable.sort((a, b) => a.required - b.required);

  return { runnable, notRunnable };
}

module.exports = { matchModels, extractSize, requiredRAM, buildOllamaCommand };
