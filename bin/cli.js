#!/usr/bin/env node

const ora = require("ora");
const { askModelType, askUseCase } = require("../src/prompt");
const { detectSystem } = require("../src/detect");
const { fetchModels, filterByUseCase } = require("../src/openrouter");
const { matchModels } = require("../src/matcher");
const { render } = require("../src/display");

async function main() {
  // 1 + 2. Interactive prompts: free/paid, then use case
  const modelType = await askModelType();
  const useCase = await askUseCase();

  // 3. Scan system silently behind a spinner
  const scanSpinner = ora("Scanning your system...").start();
  const system = await detectSystem();
  scanSpinner.succeed("System scanned");

  // 4. Fetch models from OpenRouter, then filter by use case
  const fetchSpinner = ora("Fetching models from OpenRouter...").start();
  let models;
  try {
    const all = await fetchModels(modelType);
    models = filterByUseCase(all, useCase);
    fetchSpinner.succeed(
      `Found ${models.length} ${modelType} ${useCase} models`
    );
  } catch (err) {
    fetchSpinner.fail("Failed to fetch models from OpenRouter");
    console.error(err.message);
    process.exit(1);
  }

  // 5. RAM matching
  const { runnable, notRunnable } = matchModels(models, system);

  // 6 + 7. Display
  render({ system, modelType, useCase, runnable, notRunnable });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
