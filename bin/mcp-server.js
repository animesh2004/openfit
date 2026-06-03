#!/usr/bin/env node

// openfit MCP server — exposes openfit's hardware scan + model-fit logic as
// Model Context Protocol tools, so Claude Code / Cursor / VS Code / Windsurf /
// Zed (any MCP client) can ask "what can this machine run?" directly.

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const { detectSystem } = require("../src/detect");
const { fetchModels, filterByUseCase } = require("../src/openrouter");
const { matchModels, extractSize, QUANTS } = require("../src/matcher");
const { verifiedOllamaCommand } = require("../src/ollama-models");
const pkg = require("../package.json");

const USE_CASES = ["text", "code", "vision", "image", "audio", "any"];

const server = new Server(
  { name: "openfit", version: pkg.version },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: "scan_system",
    description:
      "Scan this machine's hardware: total/free RAM, CPU, GPU and VRAM. Use this to learn what local LLMs the user could run.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "find_runnable_models",
    description:
      "List OpenRouter models that fit on this machine, with per-quant RAM (Q4/Q8/FP16), a fast/slow verdict, and a verified `ollama pull` command where one exists. Filter by tier and use case.",
    inputSchema: {
      type: "object",
      properties: {
        tier: { type: "string", enum: ["free", "paid"], description: "OpenRouter tier (default: free)" },
        useCase: { type: "string", enum: USE_CASES, description: "text | code | vision | image | audio | any (default: any)" },
        limit: { type: "number", description: "Max runnable models to return (default: 20)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "check_model",
    description:
      "Check whether a specific model fits on this machine. Accepts a model id or any string containing a size (e.g. 'meta-llama/llama-3.1-70b' or '13b'). Returns per-quant RAM needs, a fast/slow/won't-run verdict, and a verified ollama command if available.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model id or name/size, e.g. 'qwen2.5-coder-7b' or '70b'" },
      },
      required: ["model"],
      additionalProperties: false,
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

function text(obj) {
  return { content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] };
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  if (name === "scan_system") {
    const sys = await detectSystem();
    return text({
      ram_total_gb: sys.totalRAM,
      ram_free_gb: sys.freeRAM,
      cpu: sys.cpu,
      gpu: sys.gpu,
      vram_gb: sys.vram,
      os: sys.os,
    });
  }

  if (name === "find_runnable_models") {
    const tier = args.tier === "paid" ? "paid" : "free";
    const useCase = USE_CASES.includes(args.useCase) ? args.useCase : "any";
    const limit = Number.isFinite(args.limit) ? Math.max(1, args.limit) : 20;

    const sys = await detectSystem();
    const all = await fetchModels(tier);
    const models = filterByUseCase(all, useCase);
    const { runnable, notRunnable } = matchModels(models, sys);

    return text({
      system: { ram_gb: sys.totalRAM, vram_gb: sys.vram, os: sys.os },
      filter: { tier, useCase },
      total_matched: models.length,
      can_run_count: runnable.length,
      cannot_run_count: notRunnable.length,
      can_run: runnable.slice(0, limit).map((m) => ({
        id: m.id,
        size: m.sizeLabel,
        best_quant: m.best.label,
        best_required_gb: m.best.required,
        speed: m.speed,
        ollama: m.ollama,
      })),
    });
  }

  if (name === "check_model") {
    const modelStr = String(args.model || "");
    const size = extractSize(modelStr);
    if (!size) {
      return text(`Could not detect a parameter size in "${modelStr}". Include a size like "7b", "13b", or "8x7b".`);
    }
    const sys = await detectSystem();
    const quants = QUANTS.map((q) => {
      const required = Math.max(1, Math.ceil(size.paramsB * q.bpw * 1.2));
      return { quant: q.label, required_gb: required, fits_ram: sys.totalRAM >= required };
    });
    const best = quants.find((q) => q.fits_ram) || null;
    const verdict = !best
      ? "won't run (even Q4 exceeds RAM)"
      : sys.vram > 0 && best.required_gb <= sys.vram
      ? "fast (fits in VRAM)"
      : "slow (runs in RAM, no GPU offload)";

    return text({
      model: modelStr,
      size: size.label,
      params_b: size.paramsB,
      system: { ram_gb: sys.totalRAM, vram_gb: sys.vram },
      quants,
      best_quant: best ? best.quant : null,
      verdict,
      ollama: verifiedOllamaCommand(modelStr, size.tag),
    });
  }

  return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is the JSON-RPC channel.
  console.error(`openfit MCP server v${pkg.version} running on stdio`);
}

main().catch((err) => {
  console.error("openfit MCP server failed:", err);
  process.exit(1);
});
