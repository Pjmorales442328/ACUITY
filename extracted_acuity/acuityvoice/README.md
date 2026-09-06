# AcuityVoice 🎙️

> **Autonomous Spoken English & Candidate Screening Voice Agent**  
> Built on the **AssemblyAI Voice Agent API** for high-volume customer-facing recruitment (BPOs, Contact Centers, Tech Support).  
> Submitted to the [AssemblyAI - Voice Agent Hackathon on lablab.ai](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon).

---

## 🌟 Overview

Every year, global Business Process Outsourcing (BPO) firms and multinational customer support centers spend millions of hours manually screening job applicants for spoken English proficiency and customer de-escalation skills.

Legacy automated tests (like **Pearson Versant**) rely on robotic "repeat after me" exercises that candidates memorize and game—failing to test how an applicant handles real customer friction, interruptions, and high-pressure scenarios.

**AcuityVoice** replaces rigid exams with an **autonomous 3-minute interactive conversational roleplay**:
1. **Authentic Customer Simulation**: The voice agent calls in as an agitated customer with an unauthorized charge, delivery failure, or tech outage.
2. **Sub-Second Turn-Taking & Interruption (Barge-In)**: If the candidate speaks or interrupts to calm the customer, AssemblyAI's voice activity detection (VAD) stops the agent immediately with low latency.
3. **Real-Time JSON-Schema Tool Calling**: Concurrently evaluates CEFR spoken English (Fluency, Grammar, Vocabulary, Pronunciation) and logs empathy and de-escalation markers in real time.
4. **Instant Diagnostic Scorecard**: Generates an objective, audit-ready PDF scorecard for hiring managers.

---

## 🏗️ System Architecture

```
                    +------------------------------------------+
                    |           Candidate Microphone           |
                    |      Web Audio API (16kHz 16-bit PCM)    |
                    +--------------------+---------------------+
                                         | Binary Audio Stream (WebSocket)
                                         v
                    +------------------------------------------+
                    |          AcuityVoice Gateway             |
                    |             (FastAPI Server)             |
                    +--------------------+---------------------+
                                         | Bi-directional WebSocket
                                         v
                    +------------------------------------------+
                    |        AssemblyAI Voice Agent API        |
                    |   • Universal-3 Pro STT                  |
                    |   • Server VAD (Turn-Taking & Barge-In)  |
                    |   • LLM Dialog Orchestration             |
                    |   • Low-Latency Voice Generation         |
                    +--------------------+---------------------+
                                         | Tool Invocation Events (JSON Schema)
                                         v
    +-------------------------------------------------------------------------+
    | Tool Execution Engine:                                                  |
    | 1. log_conversational_marker(type, quote, impact, coaching_note)        |
    | 2. update_customer_temperament(new_state, trigger_reason, score)        |
    | 3. generate_candidate_scorecard(cefr_level, dimension_scores, verdict)  |
    +------------------------------------+------------------------------------+
                                         | Live Event Push
                                         v
    +-------------------------------------------------------------------------+
    |                     Recruiter ATS Dashboard (Web UI)                    |
    |  • Live Audio Waveform & Latency Monitor (< 350ms)                      |
    |  • Diarized Real-Time Transcript with Linguistic Marker Badges          |
    |  • Dynamic CEFR Competency Radar Chart (Chart.js)                       |
    |  • Post-Call Audit Scorecard with PDF Export                            |
    +-------------------------------------------------------------------------+
```

---

## ⚡ Key Differentiators

| Dimension | Legacy Tools (Pearson Versant) | AcuityVoice (AssemblyAI) |
| :--- | :--- | :--- |
| **Testing Paradigm** | Monologue ("Repeat this sentence", "Read aloud") | Live multi-turn interactive roleplay interview |
| **Barge-In / Interruption** | None (rigid recording beeps) | Natural interruption handling via AssemblyAI VAD |
| **Assessment Scope** | Acoustic pronunciation matching only | Spoken fluency, vocabulary, grammar + customer empathy |
| **Integrations** | Batch CSV exports | Real-time JSON tool calling into ATS & live radar visualization |
| **Cost & Speed** | \$15–\$35 per test; slow results | Sub-second real-time scoring at fraction of the cost |

---

## 🚀 Quickstart Guide

### 1. Clone & Setup Virtual Environment
```bash
git clone https://github.com/YOUR_USERNAME/acuityvoice.git
cd acuityvoice
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env`:
```ini
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
MOCK_MODE=false
MAX_SESSION_SECONDS=180
PORT=8000
```

> **💡 Zero-Credit Testing Note:**  
> Set `MOCK_MODE=true` in `.env` or toggle the **"Mock (Zero Credit)"** button on the UI header. This lets you test the full UI, audio processing, radar animations, and scorecard generation without consuming your AssemblyAI credits.

### 3. Run the Application
```bash
python backend/app.py
```
Open your browser and navigate to:
```
http://localhost:8000
```

---

## 🛡️ Credit Preservation Guardrails

To protect your **$150 developer credits** (~33 hours of live streaming):
1. **Hard Session Cap**: The backend automatically enforces a strict **180-second (3-minute) maximum session duration** before closing the connection.
2. **Auto-Cleanup**: If the browser tab is closed or the "End Call" button is clicked, the WebSocket connection is immediately terminated.
3. **Mock Mode Simulator**: Always test prompt tweaks or UI changes in Mock Mode first.

---

## 📜 Open Source License
This project is licensed under the **MIT License** — compliant with lablab.ai open-source submission standards.
