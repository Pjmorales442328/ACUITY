// Top navigation bar with the app's main tabs.
import React from 'react';
import { BookOpen, Layers, Mic, PhoneCall, Users } from 'lucide-react';
import type { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  candidateCount: number;
}

const NAV: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'SCREENING', label: 'Live Screening', icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { id: 'CANDIDATES', label: 'Candidates', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'SCENARIOS', label: 'Scenario Studio', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'ARCHITECTURE_DECK', label: 'How It Works', icon: <Layers className="w-3.5 h-3.5" /> }
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, candidateCount }) => (
  <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-2xs">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
          <Mic className="w-4 h-4 text-slate-100" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900">AcuityVoice</span>
          <p className="text-[11px] text-slate-500 hidden sm:block">Voice roleplay screening for contact-center hiring</p>
        </div>
      </div>

      <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto justify-center overflow-x-auto">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition whitespace-nowrap text-xs cursor-pointer ${
              activeTab === item.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'CANDIDATES' && candidateCount > 0 && (
              <span className="ml-1 px-1.5 rounded text-[10px] bg-slate-900 text-white font-mono font-semibold">{candidateCount}</span>
            )}
          </button>
        ))}
      </nav>

      <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
        Built on AssemblyAI
      </span>
    </div>
  </header>
);
