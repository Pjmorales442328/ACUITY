// Hiring and certification bars for script-generated levels, applied in code so the model never decides pass/fail.
import { BARS } from '../src/data/bars';
import type { BarResult, PracticeLevel, Readiness, ScriptStep } from '../src/types';

const READINESS_LABEL: Record<Readiness, string> = {
  READY: 'Ready',
  READY_WITH_COACHING: 'Ready with coaching',
  NEEDS_TRAINING: 'Needs training',
  INSUFFICIENT_SAMPLE: 'Not enough speech'
};

// Level 1 is practice only, so it has no bar.
export function evaluateBar(level: PracticeLevel | undefined, readiness: Readiness, steps: ScriptStep[], adherence: number | null): BarResult | null {
  if (level !== 2 && level !== 3) return null;
  const bar = BARS[level];
  const reasons: string[] = [];
  if (readiness === 'INSUFFICIENT_SAMPLE') reasons.push('Not enough speech to judge');
  for (const s of steps) if (s.critical && s.status !== 'DONE') reasons.push(`Critical step not completed: ${s.step}`);
  if (adherence !== null && adherence < bar.minAdherence) reasons.push(`Script followed ${adherence}%, needs ${bar.minAdherence}%`);
  if (readiness !== 'INSUFFICIENT_SAMPLE' && !(bar.readiness as readonly string[]).includes(readiness)) {
    reasons.push(`Readiness is ${READINESS_LABEL[readiness]}, needs ${bar.readiness.map(r => READINESS_LABEL[r]).join(' or ')}`);
  }
  return { name: bar.name, passed: reasons.length === 0, reasons };
}
