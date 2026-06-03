# openfit

Find which LLMs can run on your machine.

## Usage

```bash
npx openfit
```

## What it does

- Detects your system RAM, CPU, and GPU
- Fetches all models from OpenRouter
- Shows which ones you can actually run locally
- Gives you the exact ollama pull command

## How it works

1. Pick **Free** or **Paid** models (arrow keys).
2. Pick a **use case** — Text/Chat, Code, Vision, Image generation, Audio, or Any.
3. `openfit` scans your hardware (RAM, CPU, GPU) silently.
4. It pulls the full model list from the public OpenRouter API — no API key needed —
   and filters it to your use case using each model's input/output modalities.
5. It estimates each model's RAM requirement from its parameter size and compares
   it against your total RAM.
6. You get two lists: models you **can** run (with the `ollama pull` command) and
   models you **can't** (with how much more RAM you'd need).

> Note: OpenRouter is mostly text/chat and multimodal LLMs. Vision and code models
> are well represented; true image-generation and audio models are a short list
> (and mostly on the paid tier).

## Don't have the RAM?

Any model can be run through the [OpenRouter API](https://openrouter.ai) without
local hardware.

## License

MIT
