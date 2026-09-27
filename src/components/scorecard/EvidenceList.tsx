// Evaluator findings, each backed by a verbatim candidate quote and the moment it was said.
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { clock } from '../../lib/labels';
import type { Finding } from '../../types';

interface EvidenceListProps {
  findings: Finding[];
  rejected: number;
  onJump: (atMs: number) => void;
}

const Group: React.FC<{ title: string; items: Finding[]; positive: boolean; onJump: (ms: number) => void }> = ({ title, items, positive, onJump }) => (
  <div className="space-y-2">
    <h4 className={`text-[11px] font-bold uppercase ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{title}</h4>
    {items.map((f, i) => (
      <div key={i} className={`p-3 rounded-lg border ${positive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          {positive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          <span className="text-[10px] font-bold text-slate-700">{f.dimension}</span>
          <button onClick={() => onJump(f.atMs)} className="ml-auto text-[10px] font-mono text-blue-700 hover:underline cursor-pointer">
            at {clock(f.atMs)}
          </button>
        </div>
        <blockquote className="text-xs text-slate-900 italic border-l-2 border-slate-300 pl-2">"{f.quote}"</blockquote>
        <p className="text-xs text-slate-600 mt-1.5">{f.coaching}</p>
      </div>
    ))}
  </div>
);

export const EvidenceList: React.FC<EvidenceListProps> = ({ findings, rejected, onJump }) => {
  const strengths = findings.filter(f => f.impact === 'POSITIVE');
  const gaps = findings.filter(f => f.impact === 'NEGATIVE');
  if (!findings.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Evidence</h3>
      <p className="text-[11px] text-slate-500">
        Every quote was checked word for word against the candidate's transcript.
        {rejected > 0 && ` ${rejected} finding${rejected > 1 ? 's' : ''} without a matching quote ${rejected > 1 ? 'were' : 'was'} discarded.`}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {strengths.length > 0 && <Group title="Strengths" items={strengths} positive onJump={onJump} />}
        {gaps.length > 0 && <Group title="To improve" items={gaps} positive={false} onJump={onJump} />}
      </div>
    </section>
  );
};
