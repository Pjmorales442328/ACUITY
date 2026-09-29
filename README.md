# AcuityVoice

**Hear the call before you make the hire.** Hire and certify call-center agents against the client's own playbook, built entirely on AssemblyAI.

**Live app:** _[app URL]_ · **Demo video (3:55):** _[video link]_

## The problem

When a bank outsources its customer calls, it hands the call center (a BPO) a playbook: greet like this, read this disclosure word for word, verify every caller, never promise an instant refund. The BPO then has to hire and certify hundreds of agents to follow it. Today that means a trainer, one mock call and a gut feeling. Interviews check English and attitude, not the client's call flow, so the first real test is a live customer. And a skipped disclosure there is a compliance failure for the client.

## What AcuityVoice does

1. **Upload the client's playbook** (.docx/.pdf). In about 15 seconds it finds every call type (the sample has disputes, lost cards and late fees), with each one's call flow, auto-fail steps, policies and objections.
2. **Get call types × 3 levels**: practice, the **hiring bar** (a frustrated caller) and the **certification bar** (a hostile one).
3. **Put a candidate on a live voice call.** The AssemblyAI Voice Agent plays the customer, in character and in real time.
4. **Get a pass/fail verdict with evidence.** Every playbook step is marked done or missed, backed by the candidate's exact words and a timestamp. The verdict is computed in code, never guessed by a model.

On the same Level 2 caller, the demo's strong candidate passes the hiring bar with 100% of the call flow. The new hire fails for promising "you'll see the credit by this Friday", which the playbook forbids, and the report quotes that line.

## How it works

1. **Live call (Voice Agent API).** The customer persona, opening line, voice and keyterms come from the selected scenario. It uses `transcription_mode: "max_accuracy"` so candidates who pause aren't cut off. The customer has no tools, so it never goes silent mid-call.
2. **Measure (Universal-3.5 Pro).** The server records the candidate's microphone audio. After the call it is transcribed with `disfluencies: true` and `keyterms_prompt`. Pace, filler rate, hesitation pauses and unclear words are calculated in code from word timestamps and confidence.
3. **Judge (Voice Agent API).** A short evaluator session receives the transcript and metrics. `reply.create` asks it to call `submit_assessment`, and the tool arguments become the scorecard: five rubric dimensions scored 1–5, a CEFR level, the customer outcome and findings.
4. **Verify.** Findings are kept only if their quote appears word for word in the transcript. Readiness is calculated from the scores in code. If the candidate says fewer than 25 words, the result is "Not enough speech".

**Your client's playbook.** A BPO receives a program playbook from each client. In Scenario Studio it uploads that document (`.docx`, `.pdf`, `.txt` or `.md`; two samples: `public/samples/ApexPay_Program_Playbook.docx` (card servicing: disputes, lost cards, late fees) and `public/samples/Link_TechSupport_Playbook.docx` (post-purchase PC tech support: no power, black screen, Wi-Fi; troubleshooting steps follow Dell's published no-power procedure; Link Computers is fictional)). One Voice Agent tool call (`submit_playbook`) splits it into call types, then one small call per call type (`submit_callers`, run in parallel) writes its callers. For every call type you get:
- the call flow as checkable steps, with **critical** steps flagged (verification, legal disclosures: the auto-fail items on a QA form)
- the policies the rep must state correctly (timeframes, fees), which the evaluator uses to score Accuracy
- the objections callers of that type raise
- three callers: **Level 1** cooperative (practice), **Level 2** frustrated with objections (**hiring bar**), **Level 3** hostile, resists verification and pushes policy (**certification bar**, the "ready to leave nesting" check)

The reviewer checks each call type in its own tab, can change which steps are critical, then creates every call type × level (3 call types = 9 scenarios, shown as a grid). The report adds a step checklist (each step needs a verified quote to count) and a pass/fail verdict with reasons, computed in code (`src/data/bars.ts`): the hiring bar needs every critical step, 70%+ of the script and readiness of at least *Ready with coaching*; the certification bar needs every critical step, 90%+ and *Ready*. Scenarios can also be written by hand. Custom scenarios are saved to `data/scenarios.json`.

**Demo mode.** "AI demo call" puts a second Voice Agent on the line as the rep: a **strong candidate** who follows the playbook step by step, or a **new hire** who forgets a step. The server pipes each agent's audio into the other in real time, with half-duplex turn-taking: an agent holds the floor until its reply has finished playing, and a reply that arrives early is held back, so you can see the full pipeline without a microphone. The rep is scored exactly like a human candidate.

Readiness is reported as *Ready*, *Ready with coaching* or *Needs training*. It is a signal to support human review, not an automated hiring decision.

## What we verified about the AssemblyAI Voice Agent API

We tested all of these live while building. They shaped the design:

- **A tool call that's too big gets dropped silently.** The session sends `reply.done` with no `tool.call`. So playbook analysis is split into one small call for call types, then one parallel call per call type for its callers, and `agentTool.ts` fails immediately instead of waiting for a call that will never come.
- **A voice agent that has tools can go silent mid-call.** The customer agent gets no tools. Scoring runs in a separate, silent evaluator session, where one `reply.create` triggers exactly one tool call.
- **Two agents on one line need pacing.** Unpaced bursts of audio break turn detection. Demo mode streams audio in real time with silence padding and one shared floor, which cut cross-talk from 3.5 s to 0 s per 75-second call.
- **Emotion comes from the words.** The TTS reads `[angry]` tags and SSML aloud, so the customer prompt writes the anger into short bursts, `!` and CAPS. vera, jean and jane sound angriest.
- **Leave `turn_detection` at its defaults.** Setting `min_silence` turns off adaptive pacing. To keep candidates who pause from being cut off, set `input.transcription_mode` to `max_accuracy` instead.
- **Keep the fillers.** Universal-3.5 Pro with `disfluencies: true` keeps um and uh and gives word timings, so pace, fillers and pauses are measured, not estimated. Playbook keyterms feed both the live agent and the transcription.

Quality gates: `npm test` runs 27 assertions on speech metrics, quote matching, the pass/fail bars and N/A handling for conditional steps. `npm run lint` type-checks both client and server.

## Run it

```bash
npm install
cp .env.example .env     # set ASSEMBLYAI_API_KEY
npm run dev              # http://localhost:3000
```

Use headphones during calls so the customer's voice doesn't leak into the microphone. Calls are capped at 5 minutes, and at `MAX_LIVE_CALLS` (default 3) at once, to protect API credits. A fresh install shows two sample reports (`server/sampleCandidates.json`), a pass and a fail on the same caller, until the first real call is saved.

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
  scriptAnalyzer.ts        Playbook -> call types: steps, critical steps, policies, objections, three levels each
  playbookTool.ts          JSON-Schema tools the analyzer fills in (call types, then callers)
  criteria.ts              Hiring and certification bar verdicts (+ checks in speechMetrics.test.ts)
  assessment.ts            Pipeline: transcribe -> metrics -> evaluate -> verify
  validate.ts              Sanitizes scenario/profile data from the browser
  store.ts                 Saves scorecards and custom scenarios to data/*.json
src/
  App.tsx                  Tabs, scenario library, candidate history, scorecard modal
  components/StartHere.tsx First-visit guide: playbook -> call -> verdict
  features/screening/      Live screening page
  components/              UI (scorecard/ holds the report components)
  hooks/useVoiceCall.ts    Live call state
  lib/                     Mic capture, PCM playback, transcript folding, labels
  services/                WebSocket and REST clients
  data/scenarios.ts        Built-in customer scenarios
  data/bars.ts             Pass criteria for levels 2 and 3
  components/studio/       Playbook upload, per-call-type review, call type × level grid
  types.ts                 Types shared by client and server
demo/
  narration.json           Demo-video voiceover script
  narrate.ts               Speaks each line via the Voice Agent `greeting` (npx tsx demo/narrate.ts)
  scenes.html              Title cards for the demo video (1920x1080)
```
