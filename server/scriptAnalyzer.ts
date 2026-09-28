// Turns a client's program playbook (or a single call script) into call types, each with its call flow, critical steps, policies, objections and three levels.
import crypto from 'crypto';
import type { CallType, Playbook, PracticeLevel, Scenario, VoiceId } from '../src/types';
import { callAgentTool } from './agentTool';
import { CALLERS_TOOL, PLAYBOOK_TOOL, type RawCallType, type RawCaller, type RawPlaybook } from './playbookTool';

const MAX_SCRIPT_CHARS = 20_000;
const MAX_CALL_TYPES = 4;

const INSTRUCTIONS = `You are a contact-center training designer at a BPO. A client handed over the playbook its agents must follow. Extract every call type it covers, and for each one the call flow and the rules the agent is scored on.
Base everything on the document. Never invent policies or steps it does not contain.
Standards the playbook applies to every call (greeting, disclosures, identity verification, closing) belong in every call type's flow, in the order the playbook gives them.`;

const CALLER_INSTRUCTIONS = `You are a contact-center training designer at a BPO. Write three roleplay customers for one call type in a client's playbook. They must be customers this playbook was written for, with details that fit its rules.
Level 1: a cooperative caller on the main path. Level 2: a frustrated caller who raises the playbook's objections. Level 3: a hostile caller who pushes against policy and resists verification.`;

// Callers are written in parallel, so names are handed out here to keep them unique across call types.
const NAMES = ['Sarah Jenkins', 'Marcus Reyes', 'Linda Okafor', 'David Chen', 'Priya Nair', 'Tom Walsh', 'Grace Molina', 'Kevin Brooks', 'Aisha Rahman', 'Paul Novak', 'Nina Castillo', 'Omar Haddad'];

const LEVELS: Record<PracticeLevel, { label: string; bar: string; voice: VoiceId }> = {
  1: { label: 'Cooperative caller', bar: 'Practice', voice: 'jane' },
  2: { label: 'Frustrated caller', bar: 'Hiring bar', voice: 'jean' },
  3: { label: 'Hostile caller', bar: 'Certification bar', voice: 'vera' }
};

// The Voice Agent occasionally drops a long tool call; one retry clears it.
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[scriptAnalyzer] retrying after', (err as Error).message);
    return fn();
  }
}

function toCallType(raw: RawCallType, callers: RawCaller[], program: string, keyterms: string[], id: string): CallType {
  const steps = raw.steps.slice(0, 20);
  const script = steps.map(s => s.text);
  const critical = steps.flatMap((s, i) => (s.critical ? [{ step: i + 1, reason: s.critical_reason }] : []));
  const policies = (raw.policies || []).slice(0, 10);

  const levels: Scenario[] = ([1, 2, 3] as PracticeLevel[]).map(level => {
    const c = callers.find(x => x.level === level) || callers[level - 1];
    if (!c) throw new Error(`The analyzer did not return all three callers for "${raw.name}"; try again`);
    const meta = LEVELS[level];
    return {
      id: `${id}_l${level}`,
      title: `${raw.name}: Level ${level}`,
      description: `${program}. ${meta.label}. ${meta.bar === 'Practice' ? 'Practice run on the main call flow.' : `Scored against the ${meta.bar.toLowerCase()}.`}`,
      difficulty: `Level ${level} · ${meta.bar}`,
      category: 'Custom',
      customerName: c.customer_name,
      persona: c.situation,
      greeting: c.opening_line,
      keyterms,
      voice: meta.voice,
      script,
      critical: critical.map(x => x.step),
      policies,
      level,
      playbook: program
    };
  });

  return {
    name: raw.name,
    script,
    critical,
    policies,
    objections: (raw.objections || []).slice(0, 6).map(o => ({ customerSays: o.customer_says, repShould: o.rep_should })),
    levels
  };
}

export async function analyzeScript(apiKey: string, scriptText: string): Promise<Playbook> {
  const text = scriptText.trim().slice(0, MAX_SCRIPT_CHARS);
  if (text.length < 80) throw new Error('That file has too little text to be a playbook or call script');
  const doc = `PLAYBOOK:\n"""\n${text}\n"""`;
  const raw = await withRetry(() => callAgentTool<RawPlaybook>(apiKey, `${INSTRUCTIONS}\n\n${doc}`, PLAYBOOK_TOOL, 90_000));
  const types = (raw.call_types || []).filter(t => t.steps?.length).slice(0, MAX_CALL_TYPES);
  if (!types.length) throw new Error('No call flow found in that document');

  const names = [...NAMES].sort(() => Math.random() - 0.5);
  const callers = await Promise.all(types.map((t, i) => {
    const [n1, n2, n3] = names.slice(i * 3, i * 3 + 3);
    const brief = `CALL TYPE: ${t.name}\nCALLER NAMES: level 1 ${n1}, level 2 ${n2}, level 3 ${n3}\nPOLICIES:\n${(t.policies || []).join('\n')}\nOBJECTIONS:\n${(t.objections || []).map(o => o.customer_says).join('\n')}`;
    return withRetry(() => callAgentTool<{ callers: RawCaller[] }>(apiKey, `${CALLER_INSTRUCTIONS}\n\n${brief}\n\n${doc}`, CALLERS_TOOL, 60_000));
  }));

  const keyterms = (raw.keyterms || []).slice(0, 15);
  const batch = crypto.randomUUID().slice(0, 8);
  return {
    name: raw.name,
    role: raw.role,
    callTypes: types.map((t, i) => toCallType(t, callers[i].callers || [], raw.name, keyterms, `custom_${batch}_${i}`))
  };
}
