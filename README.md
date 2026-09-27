# AcuityVoice

Voice roleplay screening for contact-center hiring, built entirely on AssemblyAI.

A candidate takes a live phone call with an upset customer played by the **AssemblyAI Voice Agent API**. When the call ends, their recorded speech is transcribed with **Universal-3.5 Pro**, which keeps filler words and word timings. A second **Voice Agent evaluator** then scores the call through a JSON-Schema tool call. The result is a readiness report in which every finding quotes the candidate's exact words, and each quote is verified against the transcript.

## How it works

1. **Live call (Voice Agent API).** The customer persona, opening line, voice and keyterms come from the selected scenario. It uses `transcription_mode: "max_accuracy"` so candidates who pause aren't cut off. The customer has no tools, so it never goes silent mid-call.
2. **Measure (Universal-3.5 Pro).** The server records the candidate's microphone audio. After the call it is transcribed with `disfluencies: true` and `keyterms_prompt`. Pace, filler rate, hesitation pauses and unclear words are calculated in code from word timestamps and confidence.
3. **Judge (Voice Agent API).** A short evaluator session receives the transcript and metrics. `reply.create` asks it to call `submit_assessment`, and the tool arguments become the scorecard: five rubric dimensions scored 1–5, a CEFR level, the customer outcome and findings.
4. **Verify.** Findings are kept only if their quote appears word for word in the transcript. Readiness is calculated from the scores in code. If the candidate says fewer than 25 words, the result is "Not enough speech".

**Your own call script.** In Scenario Studio, a company uploads the script its reps follow (`.docx`, `.pdf`, `.txt` or `.md`; a sample is in `public/samples/`). A Voice Agent tool call (`submit_playbook`) turns it into a playbook:
- the call flow as checkable steps, with **critical** steps flagged (verification, legal disclosures: the auto-fail items on a QA form)
- the policies the rep must state correctly (timeframes, fees), which the evaluator uses to score Accuracy
- the objections the script covers
- three callers built from it: **Level 1** cooperative (practice), **Level 2** frustrated with objections (**hiring bar**), **Level 3** hostile, resists verification and pushes policy (**certification bar**, the "ready to leave nesting" check)

The reviewer can change which steps are critical, then creates the levels. The report adds a step checklist (each step needs a verified quote to count) and a pass/fail verdict with reasons, computed in code (`src/data/bars.ts`): the hiring bar needs every critical step, 70%+ of the script and readiness of at least *Ready with coaching*; the certification bar needs every critical step, 90%+ and *Ready*. Scenarios can also be written by hand. Custom scenarios are saved to `data/scenarios.json`.

**Demo mode.** "Watch AI demo call" puts a second Voice Agent on the line as an AI trainee rep. The server pipes each agent's audio into the other in real time, with half-duplex turn-taking: an agent holds the floor until its reply has finished playing, and a reply that arrives early is held back, so you can see the full pipeline without a microphone. The rep is scored exactly like a human candidate.

Readiness is reported as *Ready*, *Ready with coaching* or *Needs training*. It is a signal to support human review, not an automated hiring decision.

## Run it

```bash
npm install
cp .env.example .env     # set ASSEMBLYAI_API_KEY
npm run dev              # http://localhost:3000
```

Use headphones during calls so the customer's voice doesn't leak into the microphone. Calls are capped at 3 minutes, and at `MAX_LIVE_CALLS` (default 3) at once, to protect API credits. A fresh install shows one sample report (`server/sampleCandidates.json`) until the first real call is saved.

| Command | What it does |
|---|---|
| `npm run dev` | Express + WebSocket server with Vite middleware |
| `npm run build` | Build the frontend and bundle the server to `dist/server.cjs` |
| `npm start` | Run the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Speech-metrics self-check |

### Deploy

The app needs a host that keeps WebSockets open (not serverless). `render.yaml` is a Render blueprint: New → Blueprint → pick the repo, then set `ASSEMBLYAI_API_KEY`. Free instances sleep after 15 idle minutes; switch to `starter` while judging. Saved reports live on local disk and reset on redeploy.

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
  agentTool.ts             Runs a silent Voice Agent session that answers through one JSON-Schema tool call
  evaluatorAgent.ts        Evaluator rubric and tool returning the scorecard
  scriptText.ts            Text from uploaded .docx/.pdf/.txt scripts
  scriptAnalyzer.ts        Script -> playbook: steps, critical steps, policies, objections, three levels
  criteria.ts              Hiring and certification bar verdicts (+ checks in speechMetrics.test.ts)
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
  data/bars.ts             Pass criteria for levels 2 and 3
  components/studio/       Script upload and playbook review
  types.ts                 Types shared by client and server
demo/
  narration.json           Demo-video voiceover script
  narrate.ts               Speaks each line via the Voice Agent `greeting` (npx tsx demo/narrate.ts)
  scenes.html              Title cards for the demo video (1920x1080)
```
