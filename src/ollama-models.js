// Curated map of models that actually exist in the Ollama library, with the
// parameter-size tags they ship. We only emit an `ollama pull` command when the
// family + size genuinely exists here — otherwise we tell the user to browse
// the library rather than handing them a command that 404s.
//
// Source: https://ollama.com/library  (kept intentionally conservative)

const OLLAMA_LIBRARY = {
  "llama3.2": ["1b", "3b"],
  "llama3.1": ["8b", "70b", "405b"],
  "llama3": ["8b", "70b"],
  "llama2": ["7b", "13b", "70b"],
  "gemma3": ["1b", "4b", "12b", "27b"],
  "gemma2": ["2b", "9b", "27b"],
  "gemma": ["2b", "7b"],
  "qwen3": ["0.6b", "1.7b", "4b", "8b", "14b", "32b"],
  "qwen2.5": ["0.5b", "1.5b", "3b", "7b", "14b", "32b", "72b"],
  "qwen2.5-coder": ["0.5b", "1.5b", "3b", "7b", "14b", "32b"],
  "qwen2": ["0.5b", "1.5b", "7b", "72b"],
  "phi4": ["14b"],
  "phi3": ["3.8b", "14b"],
  "phi3.5": ["3.8b"],
  "mistral": ["7b"],
  "mistral-nemo": ["12b"],
  "mixtral": ["8x7b", "8x22b"],
  "deepseek-r1": ["1.5b", "7b", "8b", "14b", "32b", "70b", "671b"],
  "deepseek-coder": ["1.3b", "6.7b", "33b"],
  "deepseek-coder-v2": ["16b", "236b"],
  "codellama": ["7b", "13b", "34b", "70b"],
  "codegemma": ["2b", "7b"],
  "starcoder2": ["3b", "7b", "15b"],
  "llava": ["7b", "13b", "34b"],
  "tinyllama": ["1.1b"],
  "smollm2": ["135m", "360m", "1.7b"],
};

// Map an OpenRouter id to an Ollama family name (best effort).
function toOllamaFamily(id) {
  const slug = id.split("/").pop().split(":")[0].toLowerCase();

  const rules = [
    [/qwen[\d.]*-?coder|qwen2\.5-coder/, "qwen2.5-coder"],
    [/qwen-?3|qwen3/, "qwen3"],
    [/qwen-?2\.5|qwen2\.5/, "qwen2.5"],
    [/qwen-?2|qwen2/, "qwen2"],
    [/llama-?3\.2/, "llama3.2"],
    [/llama-?3\.1/, "llama3.1"],
    [/llama-?3/, "llama3"],
    [/llama-?2/, "llama2"],
    [/gemma-?3/, "gemma3"],
    [/gemma-?2/, "gemma2"],
    [/gemma/, "gemma"],
    [/phi-?4/, "phi4"],
    [/phi-?3\.5/, "phi3.5"],
    [/phi-?3/, "phi3"],
    [/deepseek.*coder.*v2|deepseek-coder-v2/, "deepseek-coder-v2"],
    [/deepseek.*coder/, "deepseek-coder"],
    [/deepseek-?r1|deepseek.*r1/, "deepseek-r1"],
    [/codellama|code-llama/, "codellama"],
    [/codegemma/, "codegemma"],
    [/starcoder/, "starcoder2"],
    [/mixtral/, "mixtral"],
    [/mistral-?nemo/, "mistral-nemo"],
    [/mistral/, "mistral"],
    [/llava/, "llava"],
    [/tinyllama/, "tinyllama"],
    [/smollm/, "smollm2"],
  ];

  for (const [re, fam] of rules) {
    if (re.test(slug)) return fam;
  }
  return null;
}

// Pick the Ollama size tag matching the model's parameter size.
// e.g. paramsB 7 -> "7b" if the family ships it. MoE labels like "8x7b" match too.
function pickOllamaTag(family, sizeLabel) {
  const tags = OLLAMA_LIBRARY[family];
  if (!tags) return null;
  const wanted = sizeLabel.toLowerCase().replace(/\s+/g, "");
  return tags.find((t) => t === wanted) || null;
}

// Return a verified `ollama pull ...` command, or null if we can't vouch for it.
function verifiedOllamaCommand(id, sizeLabel) {
  const family = toOllamaFamily(id);
  if (!family) return null;
  const tag = pickOllamaTag(family, sizeLabel);
  if (!tag) return null;
  return `ollama pull ${family}:${tag}`;
}

module.exports = { OLLAMA_LIBRARY, toOllamaFamily, verifiedOllamaCommand };
