const axios = require("axios");

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

async function fetchModels(modelType) {
  const res = await axios.get(OPENROUTER_MODELS_URL, {
    timeout: 15000,
    headers: { Accept: "application/json" },
  });

  const all = (res.data && res.data.data) || [];

  const filtered = all.filter((m) => {
    const prompt = m.pricing && m.pricing.prompt;
    if (prompt === undefined || prompt === null) return false;
    const isFree = String(prompt) === "0";
    return modelType === "free" ? isFree : !isFree;
  });

  return filtered;
}

// Filter the model list by what the user wants to do with it, using
// OpenRouter's architecture.input_modalities / output_modalities fields.
// "code" has no modality flag, so we match coding-tuned models by id.
function filterByUseCase(models, useCase) {
  if (!useCase || useCase === "any") return models;

  return models.filter((m) => {
    const arch = m.architecture || {};
    const input = arch.input_modalities || [];
    const output = arch.output_modalities || [];
    const id = (m.id || "").toLowerCase();

    switch (useCase) {
      case "text":
        return output.includes("text");
      case "vision":
        return input.includes("image") && output.includes("text");
      case "image":
        return output.includes("image");
      case "audio":
        return input.includes("audio") || output.includes("audio");
      case "code":
        return (
          output.includes("text") &&
          /(coder|codestral|starcoder|code-|-code|codegen|deepseek-coder)/.test(id)
        );
      default:
        return true;
    }
  });
}

module.exports = { fetchModels, filterByUseCase };
