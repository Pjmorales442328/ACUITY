// Display labels and colors for readiness levels, customer outcomes and timestamps.
import type { CustomerOutcome, Readiness } from '../types';

export const READINESS: Record<Readiness, { label: string; pill: string; blurb: string }> = {
  READY: {
    label: 'Ready for live calls',
    pill: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    blurb: 'Every rubric dimension scored 4 or higher.'
  },
  READY_WITH_COACHING: {
    label: 'Ready with coaching',
    pill: 'bg-amber-50 border-amber-300 text-amber-800',
    blurb: 'No critical gaps, but some dimensions are below 4.'
  },
  NEEDS_TRAINING: {
    label: 'Needs training',
    pill: 'bg-rose-50 border-rose-300 text-rose-800',
    blurb: 'At least one dimension scored 2 or lower.'
  },
  INSUFFICIENT_SAMPLE: {
    label: 'Not enough speech',
    pill: 'bg-slate-100 border-slate-300 text-slate-700',
    blurb: 'The candidate did not speak enough for a fair assessment.'
  }
};

export const OUTCOME: Record<CustomerOutcome, string> = {
  RESOLVED_AND_CALMED: 'Resolved, customer calmed',
  PARTIALLY_DE_ESCALATED: 'Partially de-escalated',
  UNRESOLVED_ESCALATED: 'Unresolved, customer escalated'
};

export const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
