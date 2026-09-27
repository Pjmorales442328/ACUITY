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
- Demo mode (`server/demoRep.ts`) pipes audio between two Voice Agent sessions through a real-time pacer with silence padding. Unpaced bursts break turn detection. A shared `Floor` makes it half-duplex: an agent keeps the floor until its reply has played, and early replies wait or get flushed on interruption. This cut cross-talk from 3.5 s to 0 s per 75 s call.
- AssemblyAI has no standalone TTS. The demo voiceover uses a Voice Agent `greeting` (`demo/narrate.ts`).
- TTS has no emotion/style/speed control, and `[angry]` tags and SSML are read aloud (tested 2026-09-27). Emotion comes only from the text: short bursts, `!`/`?`, CAPS on stressed words. That's why `customerPrompt.ts` writes the anger into the words. Most expressive voices on angry text: vera, jean, alba, jane. Flattest: paul, michael, george.
- Valid English voices: alba, eve, george, jane, jean, mary, michael, anna, charles, paul, vera. `james` and `ivy` do not exist.
- Leave `turn_detection` at its default; setting `min_silence` disables adaptive pacing. Use `input.transcription_mode` instead.
- Pre-recorded requests use `speech_models: ["universal-3-5-pro", "universal-2"]` with a raw-key `authorization` header.
- The LLM Gateway is locked on the current (free) plan, and `qwen3.5-4b-32k-fast` does not support `response_format`. That is why scoring runs on a Voice Agent tool call.
- Docs index: https://www.assemblyai.com/docs/llms.txt

## Conventions

- Readiness is calculated in code (`readinessFromScores`), never taken from the model.
- Script steps (`Scenario.script`) count as DONE or PARTIAL only with a verified quote; otherwise MISSED. Adherence is computed in code.
- Findings must pass `locateQuote` (a verbatim match against the transcript) or they are discarded.
- Mic audio is streamed continuously at 24 kHz. The echo gate sends zeros instead of dropping frames.
- Public-deploy guards live in `server/callHandler.ts`: a 3-minute cap per call, plus `MAX_LIVE_CALLS` concurrent calls. `render.yaml` is the deploy blueprint.
