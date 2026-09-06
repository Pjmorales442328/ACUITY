import React, { useState } from 'react';
import {
  Layers,
  Zap,
  ShieldCheck,
  Cloud,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const ArchitectureDeckView: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const slides = [
    {
      id: 'vision',
      title: 'AcuityVoice Vision & Problem Statement',
      subtitle: 'Autonomous Spoken English & Candidate Screening Voice Agent for Global BPOs',
      badge: 'Product Specification • Slide 1',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <h4 className="font-bold text-slate-900 text-xs mb-1">The Contact Center & BPO Evaluation Bottleneck</h4>
            <p className="text-slate-600">
              BPOs and contact centers interview millions of candidates annually to evaluate Spoken English proficiency, emotional de-escalation, and situational composure. Human-led screening interviews take 30–45 minutes, cost $35+ per applicant, and suffer from evaluator subjectivity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-lg font-bold text-emerald-700 font-mono block mb-0.5">90%</span>
              <p className="text-[11px] text-slate-500">Reduction in initial screening turnaround time and operational cost.</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-lg font-bold text-blue-700 font-mono block mb-0.5">&lt; 320ms</span>
              <p className="text-[11px] text-slate-500">Sub-second Voice Agent API latency with server-side VAD.</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-lg font-bold text-slate-900 font-mono block mb-0.5">CEFR A2–C2</span>
              <p className="text-[11px] text-slate-500">Objective, standardized global Spoken English linguistic benchmarks.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'assemblyai_voice_api',
      title: 'AssemblyAI Voice Agent API Architecture',
      subtitle: 'Bi-directional Real-Time WebSocket, Server VAD, and Tool Calling',
      badge: 'Architecture • Slide 2',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400 shadow-2xs">
            <code>
              {`Candidate Mic (16kHz PCM) ──> Web Audio API
  │
  ▼ [WebSocket Stream /ws/interview]
FastAPI / Express Gateway
  │
  ▼ [Bi-Directional WSS: wss://agents.assemblyai.com/v1/ws]
AssemblyAI Voice Agent Engine
  ├── Ultra-Low Latency Speech Recognition (Server VAD < 350ms)
  ├── Autonomous Conversational Roleplay Logic (Persona Prompts)
  ├── Autonomous Tool Calling:
  │    ├── log_conversational_marker() ──> [CEFR Linguistic Radar]
  │    ├── update_customer_temperament() ──> [Emotion / Sentiment Gauge]
  │    └── generate_candidate_scorecard() ──> [Audit Scorecard & Verdict]
  └── Low-Latency TTS Audio Streaming`}
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Barge-in / Interruption Handling</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Server-side Voice Activity Detection immediately cuts off customer synthesis when candidate interrupts, enabling natural turn-taking.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>API Credit Guardrails</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Hard duration watchdogs (max 180 seconds / 3 minutes per interview) prevent runaway cloud compute and protect API tokens.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-blue-900 block">AssemblyAI Voice Agent API Reference</span>
                <p className="text-[11px] text-blue-700">
                  Built on <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[10px] text-blue-950">wss://agents.assemblyai.com/v1/ws</code> with bidirectional PCM streaming, speech-aware neural VAD turn detection, dynamic <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[10px] text-blue-950">session.update</code>, and real-time JSON Schema tool calls.
                </p>
              </div>
            </div>
            <a
              href="https://www.assemblyai.com/docs/voice-agents/voice-agent-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shrink-0 transition cursor-pointer shadow-xs"
            >
              <span>Official API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 'tool_calling_scoring',
      title: 'Linguistic Tool Calling & Diagnostic Rubric',
      subtitle: 'Dynamic CEFR Evaluation & Structured Scoring Matrix',
      badge: 'Linguistic Engine • Slide 3',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-blue-700 font-mono block mb-0.5">
                1. log_conversational_marker
              </span>
              <p className="text-[11px] text-slate-500">
                Captures candidate spoken phrases and classifies into Empathy, Active Listening, Grammatical Accuracy, or Filler Hesitation.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-emerald-700 font-mono block mb-0.5">
                2. update_customer_temperament
              </span>
              <p className="text-[11px] text-slate-500">
                Calculates real-time customer sentiment (0–100) and shifts state between Agitated, Defensive, Neutral, and Reassured.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-900 font-mono block mb-0.5">
                3. generate_candidate_scorecard
              </span>
              <p className="text-[11px] text-slate-500">
                Synthesizes multi-axis scores, CEFR ratings (A2-C2), key strengths, coaching areas, and hiring recommendations.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h5 className="font-bold text-slate-900 text-xs mb-2">5-Axis CEFR Competency Matrix:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block">Fluency</span>
                <span className="text-[10px] text-slate-500">Rhythm & Pacing</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block">Vocabulary</span>
                <span className="text-[10px] text-slate-500">Domain Lexicon</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block">Grammar</span>
                <span className="text-[10px] text-slate-500">Syntax & Tenses</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block">Pronunciation</span>
                <span className="text-[10px] text-slate-500">Phonetic Clarity</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-emerald-700 block">Empathy</span>
                <span className="text-[10px] text-slate-500">De-escalation</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cloud_deployment',
      title: 'Cloud Deployment & Enterprise Integration',
      subtitle: 'Production Container, Cloud Run, and Enterprise ATS Webhooks',
      badge: 'Integration • Slide 4',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Production Container Spec (Dockerfile)</span>
            </span>
            <pre className="bg-slate-900 p-2.5 rounded-lg text-[11px] font-mono text-slate-100 overflow-x-auto shadow-2xs">
{`FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]`}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-0.5">ATS Webhook Synchronization</span>
              <p className="text-[11px] text-slate-500">
                POST automated candidate scorecards directly to Greenhouse, Workday, Lever, or Taleo via standard REST webhooks.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-0.5">Zero-Credit Mock Testing</span>
              <p className="text-[11px] text-slate-500">
                Built-in deterministic simulation allows evaluators and recruiters to demo the complete flow with zero API key configuration.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              System Architecture & Technical Specification
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            System architecture, AssemblyAI Voice Agent API integration, and CEFR grading documentation.
          </p>
        </div>

        {/* Slide Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(idx)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                activeSlide === idx
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono mb-1.5 inline-block">
              {slides[activeSlide].badge}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {slides[activeSlide].title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {slides[activeSlide].subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setActiveSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {/* Slide Content Body */}
        {slides[activeSlide].content}
      </div>
    </div>
  );
};

