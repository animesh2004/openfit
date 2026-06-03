#!/usr/bin/env node

const ora = require("ora");
const { askModelType, askUseCase } = require("../src/prompt");
const { detectSystem } = require("../src/detect");
const { fetchModels, filterByUseCase } = require("../src/openrouter");
const { matchModels } = require("../src/matcher");
const { render, renderJSON } = require("../src/display");
const pkg = require("../package.json");

const USE_CASES = ["text", "code", "vision", "image", "audio", "any"];

function parseArgs(argv) {
  const out = { modelType: null, useCase: null, json: false, help: false, version: false };
  for (const a of argv) {
    const f = a.toLowerCase();
    if (f === "--free") out.modelType = "free";
    else if (f === "--paid") out.modelType = "paid";
    else if (f === "--json") out.json = true;
    else if (f === "-h" || f === "--help") out.help = true;
    else if (f === "-v" || f === "--version") out.version = true;
    else if (f.startsWith("--") && USE_CASES.includes(f.slice(2))) out.useCase = f.slice(2);
  }
  return out;
}

function printHelp() {
  console.log(`
llmfit — find which LLMs your machine can run, via OpenRouter

Usage:
  npx llmfit [options]

Options:
  --free | --paid              filter by OpenRouter tier (skips the prompt)
  --text | --code | --vision   use case (also: --image, --audio, --any)
  --json                       machine-readable output (non-interactive)
  -h, --help                   show this help
  -v, --version                show version

Examples:
  npx llmfit                 interactive
  npx llmfit --free --code   free coding models, no prompts
  npx llmfit --paid --json   all paid models as JSON
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) return printHelp();
  if (args.version) return console.log(pkg.version);

  // In JSON mode stay fully non-interactive; default any missing filters.
  let modelType = args.modelType;
  let useCase = args.useCase;
  if (args.json) {
    modelType = modelType || "free";
    useCase = useCase || "any";
  } else {
    if (!modelType) modelType = await askModelType();
    if (!useCase) useCase = await askUseCase();
  }

  const quiet = args.json;
  const spin = (text) => (quiet ? { succeed() {}, fail() {} } : ora(text).start());

  const scanSpinner = spin("Scanning your system...");
  const system = await detectSystem();
  scanSpinner.succeed("System scanned");

  const fetchSpinner = spin("Fetching models from OpenRouter...");
  let models;
  try {
    const all = await fetchModels(modelType);
    models = filterByUseCase(all, useCase);
    fetchSpinner.succeed(`Found ${models.length} ${modelType} ${useCase} models`);
  } catch (err) {
    fetchSpinner.fail("Failed to fetch models from OpenRouter");
    console.error(err.message);
    process.exit(1);
  }

  const { runnable, notRunnable } = matchModels(models, system);

  const payload = { system, modelType, useCase, runnable, notRunnable };
  if (args.json) renderJSON(payload);
  else render(payload);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
