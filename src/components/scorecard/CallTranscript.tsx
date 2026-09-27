// Timestamped call transcript with the lines that contain evidence highlighted.
import React, { useEffect, useRef } from 'react';
import { clock } from '../../lib/labels';
import type { Finding, TranscriptLine } from '../../types';

interface CallTranscriptProps {
  lines: TranscriptLine[];
  findings: Finding[];
  focusMs: number | null;
  candidateName: string;
}

// The candidate line that contains the moment `ms` (the last line starting at or before it).
const lineAt = (lines: TranscriptLine[], ms: number) =>
  [...lines].reverse().find(l => l.speaker === 'Candidate' && l.atMs <= ms)?.id;

export const CallTranscript: React.FC<CallTranscriptProps> = ({ lines, findings, focusMs, candidateName }) => {
  const refs = useRef(new Map<string, HTMLDivElement>());
  const focusId = focusMs === null ? undefined : lineAt(lines, focusMs);
  const evidenceIds = new Set(findings.map(f => lineAt(lines, f.atMs)));

  useEffect(() => {
    if (focusId) refs.current.get(focusId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId]);

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {lines.map(l => {
        const isCandidate = l.speaker === 'Candidate';
        return (
          <div
            key={l.id}
            ref={el => { if (el) refs.current.set(l.id, el); }}
            className={`flex gap-3 p-2.5 rounded-lg text-xs ${
              l.id === focusId ? 'bg-yellow-100 ring-2 ring-yellow-400' : evidenceIds.has(l.id) ? 'bg-blue-50' : ''
            }`}
          >
            <span className="font-mono text-slate-400 w-10 shrink-0">{clock(l.atMs)}</span>
            <span className={`font-semibold w-24 shrink-0 ${isCandidate ? 'text-slate-900' : 'text-blue-700'}`}>
              {isCandidate ? candidateName || 'Candidate' : 'Customer'}
            </span>
            <p className="text-slate-800 leading-relaxed">{l.text}</p>
          </div>
        );
      })}
    </div>
  );
};
