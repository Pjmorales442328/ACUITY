// One analyzed call type: its call flow with critical-step toggles, policies, objections, and the three levels built from it.
import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { BARS } from '../../data/bars';
import type { CallType } from '../../types';

const READINESS = { READY: 'Ready', READY_WITH_COACHING: 'Ready with coaching' } as const;

function criteriaFor(level: number) {
  if (level === 1) return 'Practice. No pass or fail; the report shows every step missed.';
  const bar = BARS[level as 2 | 3];
  return `${bar.name}: every critical step done, script followed ${bar.minAdherence}%+, readiness ${bar.readiness.map(r => READINESS[r]).join(' or ')}.`;
}

interface Props {
  callType: CallType;
  critical: Set<number>;
  onToggle: (step: number) => void;
}

export const CallTypeReview: React.FC<Props> = ({ callType, critical, onToggle }) => {
  const reasons = new Map(callType.critical.map(c => [c.step, c.reason]));
  return (
    <div className="space-y-5">
      <section>
        <h4 className="text-xs font-bold text-slate-800 mb-1">Call flow</h4>
        <p className="text-[11px] text-slate-500 mb-2">Missing a critical step fails the hiring and certification bars, like an auto-fail on a QA form. Click to change.</p>
        <ol className="space-y-1.5">
          {callType.script.map((step, i) => {
            const n = i + 1;
            const on = critical.has(n);
            return (
              <li key={n} className="flex items-start gap-2 text-xs text-slate-800">
                <span className="w-5 shrink-0 text-right font-mono text-slate-400">{n}.</span>
                <span className="flex-1">
                  {step}
                  {on && reasons.get(n) && <span className="block text-[11px] text-red-700">{reasons.get(n)}</span>}
                </span>
                <button
                  onClick={() => onToggle(n)}
                  aria-pressed={on}
                  className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold cursor-pointer ${on ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 text-slate-400 hover:text-slate-700'}`}
                >
                  <ShieldAlert className="w-3 h-3" /> {on ? 'Critical' : 'Mark critical'}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-xs font-bold text-slate-800 mb-1.5">Policies the rep must state correctly</h4>
          <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
            {callType.policies.map(p => <li key={p}>{p}</li>)}
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-bold text-slate-800 mb-1.5">Objections the callers will raise</h4>
          <ul className="space-y-1.5 text-xs">
            {callType.objections.map(o => (
              <li key={o.customerSays}>
                <span className="text-slate-800">"{o.customerSays}"</span>
                <span className="block text-slate-500">→ {o.repShould}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h4 className="text-xs font-bold text-slate-800 mb-2">Three levels for this call type</h4>
        <div className="grid gap-3 md:grid-cols-3">
          {callType.levels.map(l => (
            <div key={l.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{l.difficulty}</p>
              <p className="text-xs italic text-slate-800 bg-slate-50 border border-slate-200 rounded p-2">{l.customerName}: "{l.greeting}"</p>
              <p className="text-[11px] text-slate-600 mt-auto"><Check className="inline w-3 h-3 text-emerald-600" /> {criteriaFor(l.level || 1)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
