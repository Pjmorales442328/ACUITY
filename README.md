# AcuityVoice

Voice roleplay screening for contact-center hiring, built entirely on AssemblyAI.

A candidate takes a live phone call with an upset customer played by the **AssemblyAI Voice Agent API**. When the call ends, their recorded speech is transcribed with **Universal-3.5 Pro**, which keeps filler words and word timings. A second **Voice Agent evaluator** then scores the call through a JSON-Schema tool call. The result is a readiness report in which every finding quotes the candidate's exact words, and each quote is verified against the transcript.

## How it works

1. **Live call (Voice Agent API).** The customer persona, opening line, voice and keyterms come from the selected scenario. It uses `transcription_mode: "max_accuracy"` so candidates who pause aren't cut off. The customer has no tools, so it never goes silent mid-call.
2. **Measure (Universal-3.5 Pro).** The server records the candidate's microphone audio. After the call it is transcribed with `disfluencies: true` and `keyterms_prompt`. Pace, filler rate, hesitation pauses and unclear words are calculated in code from word timestamps and confidence.
3. **Judge (Voice Agent API).** A short evaluator session receives the transcript and metrics. `reply.create` asks it to call `submit_assessment`, and the tool arguments become the scorecard: five rubric dimensions scored 1–5, a CEFR level, the customer outcome and findings.
4. **Verify.** Findings are kept only if their quote appears word for word in the transcript. Readiness is calculated from the scores in code. If the candidate says fewer than 25 words, the result is "Not enough speech".

**Your own call script.** In Scenario Studio, a company writes its own customer and pastes its rep script, one required step per line. Candidates see the script during the call. The report adds a step-by-step checklist (done, partial or missed), and each step needs a verified quote to count. Custom scenarios are saved to `data/scenarios.json`.

**Demo mode.** "Watch AI demo call" puts a second Voice Agent on the line as an AI trainee rep. The server pipes each agent's audio into the other in real time, with half-duplex turn-taking: an agent holds the floor until its reply has finished playing, and a reply that arrives early is held back, so you can see the full pipeline without a microphone. The rep is scored exactly like a human candidate.

Readiness is reported as *Ready*, *Ready with coaching* or *Needs training*. It is a signal to support human review, not an automated hiring decision.

## Run it

```bash
npm install
cp .env.example .env     # set ASSEMBLYAI_API_KEY
npm run dev              # http://localhost:3000
```

Use headphones during calls so the customer's voice doesn't leak into the microphone. Calls are capped at 3 minutes to protect API credits.

| Command | What it does |
|---|---|
| `npm run dev` | Express + WebSocket server with Vite middleware |
| `npm run build` | Build the frontend and bundle the server to `dist/server.cjs` |
| `npm start` | Run the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Speech-metrics self-check |

## Folder structure

```
server.ts                  Express app, REST API, /ws/call WebSocket, Vite/static serving
server/
  callHandler.ts           One browser socket: live call, then post-call assessment
  customerAgent.ts         Voice Agent session playing the customer; records candidate mic audio
  customerPrompt.ts        Customer system prompt (follows AssemblyAI's prompting guide)
  demoRep.ts               Demo mode: a second Voice Agent plays the rep, audio paced in real time
  transcribe.ts            Upload + Universal-3.5 Pro transcription
  speechMetrics.ts         Pace, fillers, pauses, confidence, quote location (+ .test.ts)
  evaluatorAgent.ts        Voice Agent evaluator returning the scorecard via tool call
  assessment.ts            Pipeline: transcribe -> metrics -> evaluate -> verify
  validate.ts              Sanitizes scenario/profile data from the browser
  store.ts                 Saves scorecards and custom scenarios to data/*.json
src/
  App.tsx                  Tabs, scenario library, candidate history, scorecard modal
  features/screening/      Live screening page
  components/              UI (scorecard/ holds the report components)
  hooks/useVoiceCall.ts    Live call state
  lib/                     Mic capture, PCM playback, transcript folding, labels
  services/                WebSocket and REST clients
  data/scenarios.ts        Built-in customer scenarios
  types.ts                 Types shared by client and server
demo/
  narration.json           Demo-video voiceover script
  narrate.ts               Speaks each line via the Voice Agent `greeting` (npx tsx demo/narrate.ts)
  scenes.html              Title cards for the demo video (1920x1080)
```
