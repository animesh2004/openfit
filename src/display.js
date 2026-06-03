const chalk = require("chalk");
const boxen = require("boxen");

const DIVIDER = "━".repeat(34);
const FOOTER_DIVIDER = "─".repeat(43);

const USE_CASE_LABELS = {
  text: "TEXT/CHAT",
  code: "CODE",
  vision: "VISION",
  image: "IMAGE-GEN",
  audio: "AUDIO",
  any: "",
};

function render({ system, modelType, useCase, runnable, notRunnable }) {
  const tier = modelType === "free" ? "FREE" : "PAID";
  const useLabel = USE_CASE_LABELS[useCase] || "";
  const label = useLabel ? `${tier} ${useLabel}` : tier;

  // Header box
  const header = boxen(chalk.bold.cyan("🔍 OPENFIT SYSTEM SCAN"), {
    padding: { left: 6, right: 6, top: 0, bottom: 0 },
    borderStyle: "round",
    borderColor: "cyan",
    align: "center",
  });
  console.log("\n" + header + "\n");

  // System summary
  console.log(
    `${chalk.bold("RAM:")}  ${system.totalRAM} GB total / ${system.freeRAM} GB free`
  );
  console.log(`${chalk.bold("CPU:")}  ${system.cpu}`);
  console.log(`${chalk.bold("GPU:")}  ${system.gpu}`);
  console.log(`${chalk.bold("OS:")}   ${system.os}`);

  // CAN run
  console.log("\n" + chalk.green(DIVIDER));
  console.log(
    chalk.green.bold(`✅ ${label} models you CAN run: (${runnable.length})`)
  );
  console.log(chalk.green(DIVIDER) + "\n");

  if (runnable.length === 0) {
    console.log(chalk.dim("   (none — your RAM is below every detected model)\n"));
  }

  runnable.forEach((m, i) => {
    console.log(`${i + 1}. ${chalk.bold(m.id)}`);
    console.log(
      `   Size: ${m.sizeLabel}  |  Needs: ${m.required}GB  |  You have: ${m.have}GB ${chalk.green("✓")}`
    );
    console.log(`   ${chalk.cyan("→ " + m.ollama)}\n`);
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
      `   Size: ${m.sizeLabel}  |  Needs: ${m.required}GB  |  You have: ${m.have}GB ${chalk.red("✗")}`
    );
    console.log(
      `   ${chalk.yellow(`Missing: ${m.missing}GB more RAM needed`)}\n`
    );
  });

  // Footer
  console.log(chalk.dim(FOOTER_DIVIDER));
  console.log(chalk.bold("💡 Want to run any model without local RAM?"));
  console.log("   Use OpenRouter API instead:");
  console.log("   " + chalk.cyan.underline("https://openrouter.ai"));
  console.log(chalk.dim(FOOTER_DIVIDER) + "\n");
}

module.exports = { render };
