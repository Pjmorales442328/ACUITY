// Pass/fail against the level's hiring or certification bar, with the reasons it failed.
import React from 'react';
import { BadgeCheck, BadgeX } from 'lucide-react';
import type { BarResult } from '../../types';

export const BarVerdict: React.FC<{ bar?: BarResult | null }> = ({ bar }) => {
  if (!bar) return null;
  const Icon = bar.passed ? BadgeCheck : BadgeX;
  return (
    <section className={`flex items-start gap-3 rounded-lg border p-3 ${bar.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
      <Icon className={`w-5 h-5 shrink-0 ${bar.passed ? 'text-emerald-700' : 'text-rose-700'}`} />
      <div>
        <p className={`text-sm font-bold ${bar.passed ? 'text-emerald-800' : 'text-rose-800'}`}>{bar.name}: {bar.passed ? 'Passed' : 'Not passed'}</p>
        {bar.reasons.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-xs text-rose-800 list-disc pl-4">
            {bar.reasons.map(r => <li key={r}>{r}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
};
