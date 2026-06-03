const os = require("os");
const si = require("systeminformation");

function bytesToGB(bytes) {
  return Math.round(bytes / 1024 / 1024 / 1024);
}

async function detectSystem() {
  const platform = os.platform();

  // Sensible fallbacks from the `os` module in case systeminformation fails.
  let totalRAM = bytesToGB(os.totalmem());
  let freeRAM = bytesToGB(os.freemem());
  const cpus = os.cpus();
  let cpu = cpus && cpus.length ? cpus[0].model.trim() : "Unknown CPU";
  let gpu = "Unknown GPU";
  let vram = 0; // GB

  try {
    const [mem, cpuInfo, graphics] = await Promise.all([
      si.mem(),
      si.cpu(),
      si.graphics(),
    ]);

    if (mem && mem.total) {
      totalRAM = bytesToGB(mem.total);
      // `available` reflects reclaimable memory better than free.
      freeRAM = bytesToGB(mem.available || mem.free);
    }

    if (cpuInfo && cpuInfo.brand) {
      cpu = `${cpuInfo.manufacturer ? cpuInfo.manufacturer + " " : ""}${cpuInfo.brand}`.trim();
    }

    const controllers = (graphics && graphics.controllers) || [];
    if (controllers.length) {
      // Prefer the controller with the most VRAM (the discrete GPU, usually).
      const best = controllers.reduce((a, b) =>
        (b.vram || 0) > (a.vram || 0) ? b : a
      );
      const name = [best.vendor, best.model].filter(Boolean).join(" ").trim();
      gpu = name || "Unknown GPU";
      // si reports vram in MB; can be 0 for shared-memory integrated GPUs.
      if (best.vram && best.vram > 0) {
        vram = Math.round(best.vram / 1024);
        gpu += ` (${vram} GB VRAM)`;
      } else {
        gpu += " (shared memory)";
      }
    }
  } catch (e) {
    // Keep the os-module fallbacks.
  }

  return { totalRAM, freeRAM, cpu, gpu, vram, os: platform };
}

module.exports = { detectSystem };
