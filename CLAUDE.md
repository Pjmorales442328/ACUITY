# AcuityVoice (ACUITY)

Entry for the lablab.ai AssemblyAI Voice Agent Hackathon (deadline 2026-09-30). It is a voice roleplay screening tool for contact-center hiring. See README.md for the pipeline and folder map.

## Stack

- Vite + React 19 + TypeScript + Tailwind v4 (`src/`)
- Express + `ws` server (`server.ts`, `server/`), run with `tsx`
- **AssemblyAI only.** It uses the Voice Agent API (customer and evaluator), pre-recorded Universal-3.5 Pro, and `ASSEMBLYAI_API_KEY` in `.env`. No Gemini or other LLM providers.

## Commands

`npm run dev` · `npm run lint` · `npm test` · `npm run build`

## AssemblyAI integration rules (verified live on 2026-09-27)

- Voice Agent: `wss://agents.assemblyai.com/v1/ws`, `Authorization: Bearer <key>`. Send `session.update` on open.
- **Never give the customer agent tools.** Tool turns caused silent replies (0 audio) in testing. The evaluator uses exactly one tool, triggered by `reply.create`.
- Valid English voices: alba, eve, george, jane, jean, mary, michael, anna, charles, paul, vera. `james` and `ivy` do not exist.
- Leave `turn_detection` at its default; setting `min_silence` disables adaptive pacing. Use `input.transcription_mode` instead.
- Pre-recorded requests use `speech_models: ["universal-3-5-pro", "universal-2"]` with a raw-key `authorization` header.
- The LLM Gateway is locked on the current (free) plan, and `qwen3.5-4b-32k-fast` does not support `response_format`. That is why scoring runs on a Voice Agent tool call.
- Docs index: https://www.assemblyai.com/docs/llms.txt

## Conventions

- Readiness is calculated in code (`readinessFromScores`), never taken from the model.
- Findings must pass `locateQuote` (a verbatim match against the transcript) or they are discarded.
- Mic audio is streamed continuously at 24 kHz. The echo gate sends zeros instead of dropping frames.
