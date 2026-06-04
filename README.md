<div align="center">

# 🟢 runllm

**Will it run on your machine?**

Find out which LLMs your hardware can *actually* run — quant-aware, GPU-aware, in one command.

[![npm version](https://img.shields.io/npm/v/runllm?color=22c55e&label=npm)](https://www.npmjs.com/package/runllm)
[![npm downloads](https://img.shields.io/npm/dw/runllm?color=22c55e)](https://www.npmjs.com/package/runllm)
[![license](https://img.shields.io/npm/l/runllm?color=22c55e)](./LICENSE)
[![node](https://img.shields.io/node/v/runllm?color=22c55e)](https://nodejs.org)

[**Website**](https://animesh2004.github.io/runllm/) · [**npm**](https://www.npmjs.com/package/runllm) · [**Report a bug**](https://github.com/animesh2004/runllm/issues)

</div>

---

```bash
npx runllm
```

No install. No API key. No signup.

## Why runllm?

Ever pulled a 40GB model in Ollama only to watch it crawl — or OOM your machine entirely? Most "can I run it?" tools give you **one made-up full-precision number**. That's not how anyone runs models locally.

**runllm models reality:**

- 🧮 **Quant-aware** — computes RAM at `Q4_K_M`, `Q8_0` and `FP16`, the way models are actually run
- ⚡ **GPU-aware** — tells you if a model runs **fast** (fits in VRAM) or **slow** (RAM-only, no GPU offload)
- ✅ **Honest commands** — only shows `ollama pull` commands that *actually exist* in Ollama's library; no fake tags that 404
- 🔌 **MCP-native** — call it from **Claude Code, Cursor, VS Code, Windsurf, Zed** via the Model Context Protocol
- 🆓 **Free-tier filter** — see exactly which of OpenRouter's *free* models fit your machine
- 🤖 **Scriptable** — flags + `--json` for CI and pipelines

## Example

```text
$ npx runllm --free --text

✔ System scanned
✔ Found 25 free text models

╭──────────────────────────────────╮
│      🔍 RUNLLM SYSTEM SCAN       │
╰──────────────────────────────────╯

RAM:  16 GB total / 9 GB free
CPU:  Apple M2
GPU:  Apple M2 (16 GB VRAM)
VRAM: 16 GB VRAM
OS:   darwin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FREE TEXT/CHAT models you CAN run: (12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚡ fast = fits in VRAM   🐢 slow = runs in RAM, no GPU offload

1. meta-llama/llama-3.2-3b-instruct:free
   Size: 3B  |  Best fit: Q4_K_M ~3GB  |  ⚡ fast (fits VRAM)
   Quants: Q4_K_M 3GB ✓ · Q8_0 5GB ✓ · FP16 9GB ✓
   → ollama pull llama3.2:3b

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ FREE TEXT/CHAT models you CANNOT run: (8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. meta-llama/llama-3.1-70b:free
   Size: 70B  |  Lightest (Q4) needs: 51GB  |  You have: 16GB ✗
   Missing: 35GB more RAM (even at Q4)
```

## Usage

### Interactive (default)

```bash
npx runllm
```

Arrow keys pick the tier (**Free** / **Paid**) and a **use case**:
💬 Text/Chat · 👨‍💻 Code · 👁️ Vision · 🎨 Image generation · 🎧 Audio · 📋 Any

### Flags (skip the prompts)

```bash
npx runllm --free --code        # free coding models, no prompts
npx runllm --paid --vision      # paid multimodal models
npx runllm --free --json        # machine-readable output for scripts/CI
npx runllm --help
```

| Flag | Description |
|------|-------------|
| `--free` / `--paid` | OpenRouter tier filter |
| `--text` `--code` `--vision` `--image` `--audio` `--any` | Use-case filter |
| `--json` | Machine-readable output (fully non-interactive) |
| `-h, --help` | Help |
| `-v, --version` | Version |

### JSON output shape

```jsonc
{
  "system": { "totalRAM": 16, "freeRAM": 9, "cpu": "...", "gpu": "...", "vram": 16, "os": "darwin" },
  "filter": { "tier": "free", "useCase": "text" },
  "can_run": [
    {
      "id": "meta-llama/llama-3.2-3b-instruct:free",
      "size": "3B",
      "quants": [
        { "quant": "Q4_K_M", "required_gb": 3, "fits": true },
        { "quant": "Q8_0",   "required_gb": 5, "fits": true },
        { "quant": "FP16",   "required_gb": 9, "fits": true }
      ],
      "best_quant": "Q4_K_M",
      "speed": "fast",
      "ollama": "ollama pull llama3.2:3b"
    }
  ],
  "cannot_run": [ /* ...with missing_gb */ ]
}
```

## 🔌 Use it from your editor (MCP)

runllm ships an [MCP](https://modelcontextprotocol.io) server, so your AI assistant can answer *"what can I run on this machine?"* with live hardware data.

### Claude Code

```bash
claude mcp add runllm -- npx -y -p runllm runllm-mcp
```

### Cursor / VS Code / Windsurf / Zed

Add to your MCP config (`.cursor/mcp.json`, VS Code `mcp.json`, etc.):

```json
{
  "mcpServers": {
    "runllm": {
      "command": "npx",
      "args": ["-y", "-p", "runllm", "runllm-mcp"]
    }
  }
}
```

### Exposed tools

| Tool | What it does |
|------|--------------|
| `scan_system` | Returns this machine's RAM / CPU / GPU / VRAM |
| `find_runnable_models` | Lists OpenRouter models that fit — by tier + use case, with quant breakdown and ollama command |
| `check_model` | Checks one model/size (e.g. `"llama-3.1-70b"` or `"13b"`) → per-quant RAM + a **fast / slow / won't-run** verdict |

Then just ask your assistant things like:

> *"Which free coding models can this laptop run?"*
> *"Can I run a 70B model here? What would I need?"*

## How it works

1. **Hardware scan** — RAM, CPU, GPU and VRAM via [`systeminformation`](https://www.npmjs.com/package/systeminformation)
2. **Catalog fetch** — every model from the public OpenRouter API (no key needed), filtered by tier (`pricing.prompt`) and use case (each model's `input_modalities` / `output_modalities`)
3. **Per-quant footprint** — for each model:

   ```
   required RAM ≈ params × bytes-per-weight × 1.2 (KV-cache / runtime overhead)

   Q4_K_M → 0.6 bytes/weight
   Q8_0   → 1.1 bytes/weight
   FP16   → 2.0 bytes/weight
   ```

   Mixture-of-Experts models (`8x7b` etc.) are sized by **total** params — all experts stay resident in memory, MoE only saves compute.
4. **Verdict** —
   - best quant fits in **VRAM** → ⚡ **fast**
   - fits in **RAM** only → 🐢 **slow** (CPU inference)
   - doesn't fit even at Q4 → ❌ **can't run** (+ how many GB short)
5. **Verified commands** — the `ollama pull` suggestion is checked against a curated map of the real [Ollama library](https://ollama.com/library); if the model isn't there, runllm says so instead of inventing a tag

### Don't have the RAM?

Any model can still be used through the [OpenRouter API](https://openrouter.ai) — it runs on their servers, so your hardware doesn't matter.

## Project structure

```
runllm/
├── bin/
│   ├── cli.js            # CLI entry point (prompts, flags, output)
│   └── mcp-server.js     # MCP server (stdio) for editor integration
├── src/
│   ├── detect.js         # RAM / CPU / GPU / VRAM detection
│   ├── openrouter.js     # OpenRouter fetch + tier/use-case filters
│   ├── matcher.js        # quant-aware RAM math + fast/slow verdict
│   ├── ollama-models.js  # curated Ollama library map (verified pulls)
│   ├── prompt.js         # interactive prompts (inquirer)
│   └── display.js        # terminal UI (chalk/boxen) + JSON renderer
└── docs/                 # landing page (GitHub Pages / Vercel)
```

## Roadmap

- [ ] Test suite + CI (GitHub Actions)
- [ ] Auto-publish on tag
- [ ] Per-model use-case tags in output (`[code]` `[vision]`)
- [ ] CPU-graded speed for the RAM-only path
- [ ] `runllm check <model>` subcommand
- [ ] Detect already-installed Ollama models (✓ you have this one)
- [ ] OpenRouter response caching + offline mode

## Contributing

Issues and PRs welcome!

```bash
git clone https://github.com/animesh2004/runllm.git
cd runllm
npm install
node bin/cli.js        # run the CLI
node bin/mcp-server.js # run the MCP server (stdio)
```

Found a model whose size is detected wrong, or an `ollama pull` mapping that's missing? Open an issue with the model id — `src/ollama-models.js` and `src/matcher.js` are easy to extend.

## License

[MIT](./LICENSE) © 2026 Animesh

---

<div align="center">

**If runllm saved you a wasted 40GB download, consider a ⭐**

</div>
