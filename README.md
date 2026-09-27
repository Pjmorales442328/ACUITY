# AcuityVoice (ACUITY)

Autonomous spoken-English & candidate-screening voice agent for BPOs, contact
centers, and enterprise ATS evaluations. Runs a live voice interview over
WebSocket, scores the candidate against a rubric using Gemini, and shows
real-time transcript, temperament, and marker feedback.

## Setup

```
bun install          # or npm install
cp .env.example .env # fill in GEMINI_API_KEY, optional ASSEMBLYAI_API_KEY
npm run dev           # starts the Express + WebSocket server (tsx server.ts)
```

Open the served URL in a browser with microphone access.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run server + frontend in dev mode |
| `npm run build` | Build frontend (Vite) and bundle server to `dist/server.cjs` |
| `npm start` | Run the built server |
| `npm run lint` | Type-check with `tsc --noEmit` |

## Folder structure

- `server.ts`, `server/` — Express app, WebSocket handling, AssemblyAI live
  transcription session, scoring rubric.
- `src/` — React frontend: components, scoring engine, transcript
  deduplication, scenario data.
- `extracted_acuity/`, `acuityvoice_project.zip` — original AI Studio export;
  likely superseded by the root app, kept for reference.

See `CLAUDE.md` for more detail on architecture and conventions.
