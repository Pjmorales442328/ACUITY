# AcuityVoice (ACUITY)

Autonomous spoken-English & candidate-screening voice agent for BPOs, contact
centers, and enterprise ATS evaluations. Runs a live voice interview, scores
the candidate against a rubric, and surfaces transcript/temperament/marker
feedback in real time.

## Stack

- Vite + React 19 + TypeScript (frontend, `src/`)
- Express + `ws` (WebSocket) server (`server.ts`, `server/`), run via `tsx`
- Google Gemini API (`@google/genai`) for AI scoring/dialogue
- AssemblyAI real-time voice session (`server/assemblyai_session.ts`)
- Tailwind CSS v4

## Run it

```
bun install   # or npm install (bun.lock present)
cp .env.example .env   # fill in GEMINI_API_KEY, optional ASSEMBLYAI_API_KEY
npm run dev     # tsx server.ts — serves frontend + WS/API
npm run build   # vite build + esbuild bundle of server.ts -> dist/server.cjs
npm start       # run built server
npm run lint    # tsc --noEmit
```

## Structure

```
server.ts                        # Express + WebSocket entrypoint
server/
  assemblyai_session.ts          # AssemblyAI live transcription session handling
  scoring_rubric.ts              # candidate scoring rubric logic
src/
  App.tsx                        # root app component
  main.tsx                       # React entrypoint
  types.ts                       # shared frontend types
  data/scenarios.ts              # interview scenario definitions
  components/                    # UI: transcript feed, radar chart, scorecard,
                                  # candidate profile/history, waveform, etc.
  utils/
    scoringEngine.ts             # client-side scoring logic
    transcriptDeduplicator.ts    # dedupes streamed transcript chunks
extracted_acuity/                # unpacked copy from acuityvoice_project.zip
acuityvoice_project.zip          # original AI Studio export archive
```

Note: `extracted_acuity/` and `acuityvoice_project.zip` look like a duplicate/
archived copy of the app (AI Studio export). Confirm with the user before
editing both copies — likely only `src/`, `server/`, `server.ts` at repo root
are the live app.

## Secrets

- `.env` holds `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `APP_URL` — never commit.
- `.env.example` documents placeholders; keep it in sync when adding new vars.
