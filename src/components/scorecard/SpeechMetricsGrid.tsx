// Objective speaking metrics measured from the candidate's audio, not judged by an LLM.
import React from 'react';
import type { SpeechMetrics } from '../../types';

const Metric: React.FC<{ label: string; value: string; hint: string; warn?: boolean }> = ({ label, value, hint, warn }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
    <span className="block text-[10px] uppercase font-semibold text-slate-500">{label}</span>
    <span className={`text-lg font-bold font-mono ${warn ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
    <span className="block text-[10px] text-slate-500">{hint}</span>
  </div>
);

export const SpeechMetricsGrid: React.FC<{ m: SpeechMetrics }> = ({ m }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Measured speech</h3>
    <p className="text-[11px] text-slate-500">
      From word-level timestamps and confidence in the AssemblyAI Universal-3.5 Pro transcript, with filler words kept.
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Metric label="Pace" value={`${m.wordsPerMinute} wpm`} hint="Typical: 120-160" warn={m.wordsPerMinute > 0 && (m.wordsPerMinute < 100 || m.wordsPerMinute > 180)} />
      <Metric label="Filler words" value={String(m.fillerCount)} hint={`${m.fillersPer100Words} per 100 words`} warn={m.fillersPer100Words > 4} />
      <Metric label="Hesitations" value={String(m.hesitationPauses)} hint="Mid-answer pauses 0.8-2.5s" warn={m.hesitationPauses > 4} />
      <Metric label="Clarity" value={`${Math.round(m.avgWordConfidence * 100)}%`} hint="Avg. word recognition confidence" warn={m.avgWordConfidence < 0.85} />
    </div>
    <p className="text-[11px] text-slate-500">
      {m.wordCount} words over {m.speakingSeconds}s of speech.
      {m.unclearWords.length > 0 && <> Unclear words: <span className="font-mono text-slate-700">{m.unclearWords.join(', ')}</span></>}
    </p>
  </section>
);
