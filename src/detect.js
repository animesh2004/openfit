const os = require("os");
const { exec } = require("child_process");

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 8000 }, (err, stdout) => {
      if (err) return resolve("");
      resolve((stdout || "").trim());
    });
  });
}

function bytesToGB(bytes) {
  return Math.round(bytes / 1024 / 1024 / 1024);
}

async function detectGPU(platform) {
  try {
    if (platform === "darwin") {
      const out = await run("system_profiler SPDisplaysDataType");
      if (!out) return "Unknown GPU";
      // Grab the "Chipset Model:" line if present
      const match = out.match(/Chipset Model:\s*(.+)/);
      if (match) return match[1].trim();
      return "Apple integrated";
    }

    if (platform === "linux") {
      const out = await run(
        "nvidia-smi --query-gpu=memory.total --format=csv,noheader"
      );
      if (out) return `NVIDIA GPU (${out.split("\n")[0].trim()})`;
      return "No NVIDIA GPU detected";
    }

    if (platform === "win32") {
      const out = await run("wmic path win32_VideoController get AdapterRAM");
      if (out) {
        const lines = out
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !/AdapterRAM/i.test(l));
        const ramBytes = parseInt(lines[0], 10);
        if (!isNaN(ramBytes) && ramBytes > 0) {
          return `GPU (${bytesToGB(ramBytes)} GB VRAM)`;
        }
      }
      // Fallback: get the GPU name
      const nameOut = await run("wmic path win32_VideoController get name");
      if (nameOut) {
        const lines = nameOut
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !/^name$/i.test(l));
        if (lines[0]) return lines[0];
      }
      return "Unknown GPU";
    }
  } catch (e) {
    return "Unknown GPU";
  }
  return "Unknown GPU";
}

async function detectSystem() {
  const platform = os.platform();
  const totalRAM = bytesToGB(os.totalmem());
  const freeRAM = bytesToGB(os.freemem());
  const cpus = os.cpus();
  const cpu = cpus && cpus.length ? cpus[0].model.trim() : "Unknown CPU";
  const gpu = await detectGPU(platform);

  return {
    totalRAM,
    freeRAM,
    cpu,
    gpu,
    os: platform,
  };
}

module.exports = { detectSystem };
