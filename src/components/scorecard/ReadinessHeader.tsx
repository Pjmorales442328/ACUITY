// Scorecard summary: readiness signal, CEFR level, customer outcome and rubric radar.
import React from 'react';
import { OUTCOME, READINESS } from '../../lib/labels';
import type { Scorecard } from '../../types';
import { RadarChart } from '../RadarChart';

export const ReadinessHeader: React.FC<{ sc: Scorecard }> = ({ sc }) => {
  const r = READINESS[sc.readiness];
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${r.pill}`}>{r.label}</span>
          {sc.cefr && (
            <span className="text-sm font-bold font-mono px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">CEFR {sc.cefr}</span>
          )}
          {sc.customerOutcome && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">{OUTCOME[sc.customerOutcome]}</span>
          )}
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">{sc.summary}</p>
        {sc.cefrRationale && <p className="text-xs text-slate-500"><b>CEFR evidence:</b> {sc.cefrRationale}</p>}
        <p className="text-[11px] text-slate-400">{r.blurb} A readiness signal to support human review, not an automated hiring decision.</p>
      </div>
      {sc.dimensionScores && (
        <div className="flex flex-col items-center">
          <RadarChart scores={sc.dimensionScores} />
          <span className="text-[10px] text-slate-500 mt-1">Rubric 1-5 · dashed line = ready (4)</span>
        </div>
      )}
    </div>
  );
};
