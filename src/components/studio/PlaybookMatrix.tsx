// Scenarios built from one client playbook, laid out as call types (rows) by levels (columns), each cell a startable roleplay.
import React from 'react';
import { Play } from 'lucide-react';
import type { Scenario } from '../../types';

const COLUMNS = [
  { level: 1, label: 'Level 1 · Practice', tone: 'text-slate-700' },
  { level: 2, label: 'Level 2 · Hiring bar', tone: 'text-amber-700' },
  { level: 3, label: 'Level 3 · Certification bar', tone: 'text-red-700' }
];

const callTypeOf = (s: Scenario) => s.title.replace(/: Level \d$/, '');

interface Props {
  playbook: string;
  scenarios: Scenario[];
  activeScenarioId: string;
  onStartRoleplay: (scenarioId: string) => void;
}

export const PlaybookMatrix: React.FC<Props> = ({ playbook, scenarios, activeScenarioId, onStartRoleplay }) => {
  const rows = [...new Set(scenarios.map(callTypeOf))];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs overflow-x-auto">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client playbook</p>
      <h3 className="text-sm font-bold text-slate-900 mb-3">{playbook} <span className="font-normal text-slate-500">· {rows.length} call types × 3 levels</span></h3>
      <table className="w-full min-w-[640px] text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left font-semibold text-slate-500 pb-2 pr-3">Call type</th>
            {COLUMNS.map(c => <th key={c.level} className={`text-left font-semibold pb-2 px-2 ${c.tone}`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row} className="border-t border-slate-100 align-top">
              <td className="py-2.5 pr-3 font-semibold text-slate-900">{row}</td>
              {COLUMNS.map(c => {
                const sc = scenarios.find(s => callTypeOf(s) === row && s.level === c.level);
                if (!sc) return <td key={c.level} />;
                return (
                  <td key={c.level} className="py-2 px-2">
                    <button
                      onClick={() => onStartRoleplay(sc.id)}
                      className={`w-full text-left rounded-lg border p-2 hover:bg-blue-50 cursor-pointer ${sc.id === activeScenarioId ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'}`}
                    >
                      <span className="flex items-center gap-1 font-semibold text-slate-900"><Play className="w-3 h-3 text-blue-600" /> {sc.customerName}</span>
                      <span className="block text-[11px] italic text-slate-600 line-clamp-2">"{sc.greeting}"</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
