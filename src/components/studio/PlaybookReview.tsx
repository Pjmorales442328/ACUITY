// Review screen for an analyzed client playbook: one tab per call type, confirm critical steps, then create every call type's three levels.
import React, { useState } from 'react';
import type { Playbook, Scenario } from '../../types';
import { CallTypeReview } from './CallTypeReview';

interface Props {
  playbook: Playbook;
  onCreate: (levels: Scenario[]) => void;
  onDiscard: () => void;
}

export const PlaybookReview: React.FC<Props> = ({ playbook, onCreate, onDiscard }) => {
  const types = playbook.callTypes;
  const [tab, setTab] = useState(0);
  const [critical, setCritical] = useState(() => types.map(t => new Set(t.critical.map(c => c.step))));
  const toggle = (step: number) =>
    setCritical(prev => prev.map((set, i) => {
      if (i !== tab) return set;
      const next = new Set(set);
      next.has(step) ? next.delete(step) : next.add(step);
      return next;
    }));
  const create = () => onCreate(types.flatMap((t, i) => t.levels.map(l => ({ ...l, critical: [...critical[i]].sort((a, b) => a - b) }))));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client playbook · {playbook.role}</p>
        <h3 className="text-base font-bold text-slate-900">{playbook.name}</h3>
        <p className="text-xs text-slate-600 mt-0.5">
          Found <b>{types.length} call type{types.length > 1 ? 's' : ''}</b>. Each becomes three levels: practice, hiring bar and certification bar.
        </p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {types.map((t, i) => (
          <button
            key={t.name}
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${i === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {t.name} <span className="opacity-70">· {critical[i].size} critical</span>
          </button>
        ))}
      </div>

      <CallTypeReview callType={types[tab]} critical={critical[tab]} onToggle={toggle} />

      <div className="flex justify-end gap-2">
        <button onClick={onDiscard} className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">Discard</button>
        <button onClick={create} className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
          Create {types.length * 3} scenarios ({types.length} call types × 3 levels)
        </button>
      </div>
    </div>
  );
};
