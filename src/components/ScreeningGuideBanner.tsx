import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Bot,
  Mic,
  BarChart3,
  Award,
  Sparkles,
  Volume2
} from 'lucide-react';

interface ScreeningGuideBannerProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  appMode: 'MOCK' | 'GEMINI_AI' | 'ASSEMBLYAI';
}

export const ScreeningGuideBanner: React.FC<ScreeningGuideBannerProps> = ({
  selectedVoice,
  setSelectedVoice,
  appMode
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const assemblyVoices = [
    { id: 'Anna', label: 'Anna (Empathetic / Natural Female)', desc: 'High realism, expressive tone for customer distress' },
    { id: 'James', label: 'James (Direct / Professional Male)', desc: 'Clear, assertive turn cadence' },
    { id: 'Sophie', label: 'Sophie (Warm / Conversational)', desc: 'Smooth, natural English phonetics' },
    { id: 'Alex', label: 'Alex (Balanced / Calm Male)', desc: 'Neutral, realistic customer demeanor' },
  ];

  const geminiVoices = [
    { id: 'Kore', label: 'Kore (Empathetic / Natural Female)', desc: 'Warm, expressive, high customer realism' },
    { id: 'Puck', label: 'Puck (Direct / Assertive Male)', desc: 'Energetic, fast turn cadence' },
    { id: 'Fenrir', label: 'Fenrir (Deep / Serious Male)', desc: 'Firm, urgent customer persona' },
    { id: 'Zephyr', label: 'Zephyr (Calm / Balanced)', desc: 'Smooth, neutral customer tone' },
  ];

  const voiceOptions = appMode === 'ASSEMBLYAI' ? assemblyVoices : geminiVoices;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200/60 cursor-pointer hover:bg-slate-100/70 transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">
              How AcuityVoice Candidate Screening Works & What to Expect
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {appMode === 'ASSEMBLYAI'
                ? '2-Way Live Streaming: AssemblyAI listens to candidate voice & talks back with native audio'
                : 'Step-by-step roleplay workflow, speech recognition guide, and CEFR grading overview'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded font-mono border ${
            appMode === 'ASSEMBLYAI'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : appMode === 'GEMINI_AI'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {appMode === 'ASSEMBLYAI' ? 'AssemblyAI 2-Way Voice Agent' : appMode === 'GEMINI_AI' ? 'Gemini 3.8 + Neural TTS' : 'Demo Mode'}
          </span>
          <button className="text-slate-500 hover:text-slate-800 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-xs text-slate-600">
          {/* 4-Step Visual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Your Role: The Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                You act as the candidate / contact center support specialist. Pick a scenario (Fintech dispute, E-commerce delay, Telecom outage) and click <strong>Start Assessment Call</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  The AI: The Customer
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The AI opens the call speaking with natural emotion. With <strong>Gemini Neural TTS</strong>, the voice sounds like a real human customer with authentic pacing and inflection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  Live Voice & Streaming STT
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Speak directly into your mic. Spoken words stream live in real-time. Turn-taking and linguistic markers grade your response immediately with sub-350ms VAD.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                  4
                </span>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Diagnostic Scorecard
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                After 3–4 turns or clicking <strong>Conclude & Score</strong>, receive a certified CEFR Scorecard (A2–C2), multi-axis radar scores, coaching strengths, and ATS sync record.
              </p>
            </div>
          </div>

          {/* Voice Personality & Sound Quality Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-700" />
              <div>
                <span className="font-bold text-xs text-slate-900">
                  AI Customer Neural Voice Engine:
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5">
                  (Powered by Gemini Neural Speech Model)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer w-full sm:w-auto shadow-2xs"
              >
                {voiceOptions.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
