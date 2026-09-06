import React from 'react';
import { User, Briefcase, Mail, ChevronDown, CheckCircle } from 'lucide-react';
import { Scenario } from '../types';

interface CandidateProfileCardProps {
  candidateName: string;
  setCandidateName: (val: string) => void;
  candidateEmail: string;
  setCandidateEmail: (val: string) => void;
  targetRole: string;
  setTargetRole: (val: string) => void;
  scenarios: Scenario[];
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  isCallActive: boolean;
}

export const CandidateProfileCard: React.FC<CandidateProfileCardProps> = ({
  candidateName,
  setCandidateName,
  candidateEmail,
  setCandidateEmail,
  targetRole,
  setTargetRole,
  scenarios,
  selectedScenarioId,
  setSelectedScenarioId,
  isCallActive
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Candidate Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Candidate Name */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Candidate Name
            </label>
            <input
              type="text"
              disabled={isCallActive}
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Jordan Rivera"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition disabled:opacity-60"
            />
          </div>

          {/* Candidate Email */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Email / Talent ID
            </label>
            <input
              type="email"
              disabled={isCallActive}
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)}
              placeholder="e.g. jordan.rivera@bpo.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition disabled:opacity-60 font-mono text-[11px]"
            />
          </div>

          {/* Target Position */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Target Position & Queue
            </label>
            <input
              type="text"
              disabled={isCallActive}
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Tier-2 Dispute Specialist"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition disabled:opacity-60"
            />
          </div>
        </div>

        {/* Selected Scenario Selector */}
        <div className="lg:w-80 pt-2 lg:pt-0 lg:border-l lg:border-slate-200 lg:pl-4">
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Active Roleplay Simulation
          </label>
          <div className="relative">
            <select
              disabled={isCallActive}
              value={selectedScenarioId}
              onChange={e => setSelectedScenarioId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white appearance-none disabled:opacity-60 pr-8 cursor-pointer transition"
            >
              {scenarios.map(sc => (
                <option key={sc.id} value={sc.id} className="bg-white text-slate-900">
                  {sc.category}: {sc.title} ({sc.difficulty})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

