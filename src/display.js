const chalk = require("chalk");
const boxen = require("boxen");

const DIVIDER = "━".repeat(38);
const FOOTER_DIVIDER = "─".repeat(43);

const USE_CASE_LABELS = {
  text: "TEXT/CHAT",
  code: "CODE",
  vision: "VISION",
  image: "IMAGE-GEN",
  audio: "AUDIO",
  any: "",
};

function quantsLine(quants) {
  return quants
    .map((q) => {
      const tag = `${q.label} ${q.required}GB`;
      return q.fitsRAM ? chalk.green(tag + " ✓") : chalk.dim(tag + " ✗");
    })
    .join(chalk.dim(" · "));
}

function ollamaLine(m) {
  if (m.ollama) return chalk.cyan("→ " + m.ollama);
  return chalk.dim("→ not on Ollama — browse: ollama.com/library");
}

function render({ system, modelType, useCase, runnable, notRunnable }) {
  const tier = modelType === "free" ? "FREE" : "PAID";
  const useLabel = USE_CASE_LABELS[useCase] || "";
  const label = useLabel ? `${tier} ${useLabel}` : tier;

  const header = boxen(chalk.bold.cyan("🔍 OPENFIT SYSTEM SCAN"), {
    padding: { left: 6, right: 6, top: 0, bottom: 0 },
    borderStyle: "round",
    borderColor: "cyan",
    align: "center",
  });
  console.log("\n" + header + "\n");

  const vramStr =
    system.vram > 0 ? `${system.vram} GB VRAM` : "shared / no dedicated VRAM";
  console.log(
    `${chalk.bold("RAM:")}  ${system.totalRAM} GB total / ${system.freeRAM} GB free`
  );
  console.log(`${chalk.bold("CPU:")}  ${system.cpu}`);
  console.log(`${chalk.bold("GPU:")}  ${system.gpu}`);
  console.log(`${chalk.bold("VRAM:")} ${vramStr}`);
  console.log(`${chalk.bold("OS:")}   ${system.os}`);

  // CAN run
  console.log("\n" + chalk.green(DIVIDER));
  console.log(
    chalk.green.bold(`✅ ${label} models you CAN run: (${runnable.length})`)
  );
  console.log(chalk.green(DIVIDER));
  console.log(
    chalk.dim("   ⚡ fast = fits in VRAM   🐢 slow = runs in RAM, no GPU offload\n")
  );

  if (runnable.length === 0) {
    console.log(chalk.dim("   (none — even Q4 won't fit in your RAM)\n"));
  }

  runnable.forEach((m, i) => {
    const speed =
      m.speed === "fast"
        ? chalk.green("⚡ fast (fits VRAM)")
        : chalk.yellow("🐢 slow (RAM only)");
    console.log(`${i + 1}. ${chalk.bold(m.id)}`);
    console.log(
      `   Size: ${m.sizeLabel}  |  Best fit: ${chalk.green(
        m.best.label + " ~" + m.best.required + "GB"
      )}  |  ${speed}`
    );
    console.log(`   ${chalk.dim("Quants:")} ${quantsLine(m.quants)}`);
    console.log(`   ${ollamaLine(m)}\n`);
  });

  // CANNOT run
  console.log(chalk.red(DIVIDER));
  console.log(
    chalk.red.bold(`❌ ${label} models you CANNOT run: (${notRunnable.length})`)
  );
  console.log(chalk.red(DIVIDER) + "\n");

  if (notRunnable.length === 0) {
    console.log(chalk.dim("   (none — you can run every detected model 🎉)\n"));
  }

  notRunnable.forEach((m, i) => {
    console.log(`${i + 1}. ${chalk.bold(m.id)}`);
    console.log(
      `   Size: ${m.sizeLabel}  |  Lightest (Q4) needs: ${m.quants[0].required}GB  |  You have: ${m.have}GB ${chalk.red("✗")}`
    );
    console.log(
      `   ${chalk.yellow(`Missing: ${m.missing}GB more RAM (even at Q4)`)}\n`
    );
  });

  // Footer
  console.log(chalk.dim(FOOTER_DIVIDER));
  console.log(chalk.bold("💡 Want to run any model without local RAM?"));
  console.log("   Use OpenRouter API instead:");
  console.log("   " + chalk.cyan.underline("https://openrouter.ai"));
  console.log(chalk.dim(FOOTER_DIVIDER) + "\n");
}

// Machine-readable output for `--json`.
function renderJSON({ system, modelType, useCase, runnable, notRunnable }) {
  const strip = (m) => ({
    id: m.id,
    size: m.sizeLabel,
    params_b: m.paramsB,
    quants: m.quants.map((q) => ({
      quant: q.label,
      required_gb: q.required,
      fits: q.fitsRAM,
    })),
    best_quant: m.best ? m.best.label : null,
    best_required_gb: m.best ? m.best.required : null,
    speed: m.speed || null,
    missing_gb: m.missing || 0,
    ollama: m.ollama || null,
  });

  console.log(
    JSON.stringify(
      {
        system,
        filter: { tier: modelType, useCase },
        can_run: runnable.map(strip),
        cannot_run: notRunnable.map(strip),
      },
      null,
      2
    )
  );
}

module.exports = { render, renderJSON };
