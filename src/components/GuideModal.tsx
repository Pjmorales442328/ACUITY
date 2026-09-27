import React from 'react';
import {
  HelpCircle,
  X,
  UserCheck,
  Bot,
  Mic,
  BarChart3,
  Award,
  Sparkles,
  Volume2
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  appMode: 'MOCK' | 'GEMINI_AI' | 'ASSEMBLYAI';
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  setSelectedVoice,
  appMode
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                How AcuityVoice Candidate Screening Works
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {appMode === 'ASSEMBLYAI'
                  ? '2-Way Live Streaming: AssemblyAI listens to candidate voice & talks back with native audio'
                  : 'Step-by-step roleplay workflow, speech recognition guide, and CEFR grading overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md font-mono border ${
              appMode === 'ASSEMBLYAI'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : appMode === 'GEMINI_AI'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {appMode === 'ASSEMBLYAI' ? 'AssemblyAI 2-Way Voice Agent' : appMode === 'GEMINI_AI' ? 'Gemini 3.8 + Neural TTS' : 'Demo Mode'}
            </span>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 4-Step Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Step 1 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  1
                </span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Your Role: The Agent
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-8">
                You act as the candidate / contact center support specialist. Pick a scenario (Fintech dispute, E-commerce delay, Telecom outage) and click <strong>Start Assessment Call</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  2
                </span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                  The AI: The Customer
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-8">
                The AI opens the call speaking with natural emotion. With <strong>Gemini Neural TTS</strong>, the voice sounds like a real human customer with authentic pacing and inflection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  3
                </span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  Live Voice & Streaming STT
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-8">
                Speak directly into your mic. Spoken words stream live in real-time. Turn-taking and linguistic markers grade your response immediately with sub-350ms VAD.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  4
                </span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  Diagnostic Scorecard
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-8">
                After 3–4 turns or clicking <strong>Conclude & Score</strong>, receive a certified CEFR Scorecard (A2–C2), multi-axis radar scores, coaching strengths, and ATS sync record.
              </p>
            </div>
          </div>
        </div>

        {/* Voice Personality Control in Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-slate-700" />
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  AI Customer Voice Engine
                </span>
                <span className="text-xs text-slate-500">
                  Select the neural voice for the AI customer
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
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
      </div>
    </div>
  );
};

