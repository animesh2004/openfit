# openfit

Find which LLMs can run on your machine — quant-aware, GPU-aware, via OpenRouter.

## Usage

```bash
npx @_abstel/openfit
```

Or skip the prompts:

```bash
npx @_abstel/openfit --free --code      # free coding models, no prompts
npx @_abstel/openfit --paid --json      # all paid models, machine-readable
npx @_abstel/openfit --help             # all options
```

## What it does

- Detects your **RAM, CPU, GPU and VRAM** (via `systeminformation`)
- Fetches all models from OpenRouter (no API key) and filters by tier + use case
- Estimates real RAM at each **quant level** (Q4_K_M / Q8_0 / FP16) — the way you
  actually run models — not one made-up full-precision number
- Tells you whether each model runs **⚡ fast** (fits in VRAM) or **🐢 slow** (RAM only)
- Gives you a **verified** `ollama pull` command (only when the model really exists
  in Ollama's library — no fake commands)

## How it works

1. Pick **Free** or **Paid** (or pass `--free` / `--paid`).
2. Pick a **use case** — Text/Chat, Code, Vision, Image generation, Audio, or Any
   (or pass `--text`, `--code`, …).
3. openfit scans your hardware silently.
4. It pulls the full model list from OpenRouter and filters by your use case using
   each model's input/output modalities.
5. For every model it computes the footprint at Q4 / Q8 / FP16
   (`params × bytes-per-weight × overhead`) and checks what fits your RAM and VRAM.
   Mixture-of-Experts models are sized by **total** params (all experts stay resident).
6. You get two lists: models you **can** run (with the verified `ollama pull` command
   and a fast/slow verdict) and models you **can't** (with how much more RAM you'd
   need, even at Q4).

## Options

| Flag | Description |
|------|-------------|
| `--free` / `--paid` | Filter by OpenRouter tier (skips the prompt) |
| `--text` `--code` `--vision` `--image` `--audio` `--any` | Use case |
| `--json` | Machine-readable output (non-interactive) |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

> Note: OpenRouter is mostly text/chat and multimodal LLMs. Vision and code models
> are well represented; true image-generation and audio models are a short list
> (and mostly on the paid tier).

## Don't have the RAM?

Any model can be run through the [OpenRouter API](https://openrouter.ai) without
local hardware.

## License

MIT
