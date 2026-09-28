// Scenario library: client playbooks as call-type × level grids, plus built-in and hand-written personas, each launchable as a roleplay.
import React, { useState } from 'react';
import { BookOpen, Play, Plus } from 'lucide-react';
import type { Scenario } from '../types';
import { ScenarioForm } from './ScenarioForm';
import { PlaybookMatrix } from './studio/PlaybookMatrix';
import { ScriptImport } from './studio/ScriptImport';

interface ScenarioStudioViewProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onStartRoleplay: (scenarioId: string) => void;
  onAddScenarios: (list: Scenario[]) => void;
}

export const ScenarioStudioView: React.FC<ScenarioStudioViewProps> = ({ scenarios, activeScenarioId, onSelectScenario, onStartRoleplay, onAddScenarios }) => {
  const [creating, setCreating] = useState(false);
  const fromPlaybooks = scenarios.filter(s => s.playbook && s.level);
  const playbooks = [...new Set(fromPlaybooks.map(s => s.playbook!))];
  const others = scenarios.filter(s => !(s.playbook && s.level));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Scenario Studio</h2>
          </div>
          <p className="text-xs text-slate-500">Upload a client playbook to build its call types and levels. Each scenario becomes the persona, opening line and voice of the AssemblyAI Voice Agent customer.</p>
        </div>
        <button onClick={() => setCreating(c => !c)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Write a scenario by hand
        </button>
      </div>

      <ScriptImport onCreate={onAddScenarios} />

      {creating && (
        <ScenarioForm
          onCancel={() => setCreating(false)}
          onCreate={sc => {
            onAddScenarios([sc]);
            setCreating(false);
          }}
        />
      )}

      {playbooks.map(p => (
        <PlaybookMatrix key={p} playbook={p} scenarios={fromPlaybooks.filter(s => s.playbook === p)} activeScenarioId={activeScenarioId} onStartRoleplay={onStartRoleplay} />
      ))}

      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Built-in and hand-written scenarios</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {others.map(sc => (
          <div key={sc.id} className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col gap-3 ${sc.id === activeScenarioId ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'}`}>
            <div className="flex gap-1.5 text-[10px] font-semibold">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">{sc.category}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">{sc.difficulty}</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">voice: {sc.voice}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{sc.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{sc.description}</p>
            </div>
            <p className="text-xs text-slate-700 italic bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              {sc.customerName}: "{sc.greeting}"
            </p>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => onSelectScenario(sc.id)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer">
                {sc.id === activeScenarioId ? 'Selected' : 'Select'}
              </button>
              <button onClick={() => onStartRoleplay(sc.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
                <Play className="w-3.5 h-3.5" /> Start roleplay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
