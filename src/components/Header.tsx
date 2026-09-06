import React from 'react';
import {
  Mic,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  Users,
  BookOpen,
  Layers,
  PhoneCall
} from 'lucide-react';
import { ActiveTab, AppMode } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  isVoiceMuted: boolean;
  setIsVoiceMuted: (muted: boolean) => void;
  candidateCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  appMode,
  setAppMode,
  isVoiceMuted,
  setIsVoiceMuted,
  candidateCount
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'SCREENING', label: 'Live Screening', icon: <PhoneCall className="w-3.5 h-3.5" /> },
    { id: 'CANDIDATES', label: 'ATS Records', icon: <Users className="w-3.5 h-3.5" />, badge: candidateCount },
    { id: 'SCENARIOS', label: 'Scenario Studio', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'ARCHITECTURE_DECK', label: 'Technical Spec', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shadow-xs">
              <Mic className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  AcuityVoice
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Enterprise ATS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-normal">
                Autonomous Spoken English & Candidate Screening Agent
              </p>
            </div>
          </div>

          {/* Mobile Audio Mute */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                isVoiceMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Clean Segmented Nav */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs w-full md:w-auto justify-center overflow-x-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-white font-mono font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Operational Controls */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* TTS Audio toggle */}
          <button
            onClick={() => setIsVoiceMuted(!isVoiceMuted)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isVoiceMuted
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Toggle customer voice synthesis audio"
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isVoiceMuted ? 'Voice Muted' : 'Audio Active'}</span>
          </button>

          {/* VAD Latency Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500 text-[11px]">VAD:</span>
            <span className="font-mono text-emerald-700 font-semibold text-[11px]">&lt;320ms</span>
          </div>

          {/* Evaluation Engine Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setAppMode('ASSEMBLYAI')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                appMode === 'ASSEMBLYAI'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="2-Way Native AssemblyAI Voice Agent (Real-time STT + TTS + VAD)"
            >
              <Zap className="w-3 h-3 text-indigo-200" />
              <span>AssemblyAI 2-Way</span>
            </button>
            <button
              onClick={() => setAppMode('GEMINI_AI')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                appMode === 'GEMINI_AI'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gemini
            </button>
            <button
              onClick={() => setAppMode('MOCK')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                appMode === 'MOCK'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Sim
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

