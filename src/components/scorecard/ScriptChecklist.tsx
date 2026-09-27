// Company call-script adherence: each required step, whether the candidate covered it, and the verified quote.
import React from 'react';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import { clock } from '../../lib/labels';
import type { ScriptStep, StepStatus } from '../../types';

const STATUS: Record<StepStatus, { label: string; icon: React.ReactNode; tone: string }> = {
  DONE: { label: 'Done', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, tone: 'text-emerald-700' },
  PARTIAL: { label: 'Partial', icon: <CircleDashed className="w-4 h-4 text-amber-600" />, tone: 'text-amber-700' },
  MISSED: { label: 'Missed', icon: <XCircle className="w-4 h-4 text-rose-600" />, tone: 'text-rose-700' }
};

export const ScriptChecklist: React.FC<{ steps: ScriptStep[]; adherence: number | null; onJump: (ms: number) => void }> = ({ steps, adherence, onJump }) => {
  if (!steps.length) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Call script</h3>
        <span className="text-sm font-bold text-slate-900">{adherence}% followed</span>
      </div>
      <p className="text-[11px] text-slate-500">Your company's required steps. A step counts only if the candidate's words for it were found in the transcript.</p>
      <ol className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 p-2.5">
            {STATUS[s.status].icon}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-900"><span className="text-slate-400 mr-1">{i + 1}.</span>{s.step}{s.critical && <span className="ml-1.5 px-1.5 py-px rounded bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold uppercase">Critical</span>}</p>
              {s.quote && <blockquote className="text-xs text-slate-600 italic mt-1">"{s.quote}"</blockquote>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[10px] font-bold uppercase ${STATUS[s.status].tone}`}>{STATUS[s.status].label}</span>
              {s.atMs !== null && (
                <button onClick={() => onJump(s.atMs!)} className="text-[10px] font-mono text-blue-700 hover:underline cursor-pointer">at {clock(s.atMs)}</button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
