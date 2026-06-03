const inquirer = require("inquirer");

async function askModelType() {
  const { modelType } = await inquirer.prompt([
    {
      type: "list",
      name: "modelType",
      message: "What type of models do you want?",
      choices: [
        { name: "Free (from OpenRouter free tier)", value: "free" },
        { name: "Paid (from OpenRouter paid models)", value: "paid" },
      ],
    },
  ]);
  return modelType;
}

async function askUseCase() {
  const { useCase } = await inquirer.prompt([
    {
      type: "list",
      name: "useCase",
      message: "What do you want to use the model for?",
      choices: [
        { name: "💬  Text / Chat  (general LLMs)", value: "text" },
        { name: "👨‍💻  Code  (coding-tuned models)", value: "code" },
        { name: "👁️   Vision  (image input / multimodal)", value: "vision" },
        { name: "🎨  Image generation", value: "image" },
        { name: "🎧  Audio", value: "audio" },
        { name: "📋  Any  (show everything)", value: "any" },
      ],
    },
  ]);
  return useCase;
}

module.exports = { askModelType, askUseCase };
