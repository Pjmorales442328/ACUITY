// Turns a company's call script into a playbook: ordered steps, critical steps, policies, objections and three practice levels.
import crypto from 'crypto';
import type { Playbook, PracticeLevel, Scenario, VoiceId } from '../src/types';
import { callAgentTool } from './agentTool';

const MAX_SCRIPT_CHARS = 15_000;

interface RawPlaybook {
  name: string;
  role: string;
  steps: { text: string; critical: boolean; critical_reason: string }[];
  policies: string[];
  objections: { customer_says: string; rep_should: string }[];
  keyterms: string[];
  callers: { level: number; customer_name: string; situation: string; opening_line: string }[];
}

const str = { type: 'string' };
const PLAYBOOK_TOOL = {
  name: 'submit_playbook',
  description: 'Submit the playbook extracted from the call script. Call this exactly once, when instructed.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short name for this script, e.g. "ApexPay card disputes".' },
      role: { type: 'string', description: 'The job the rep does on these calls, e.g. "Card support representative".' },
      steps: {
        type: 'array',
        description: 'The call flow the rep must follow, in order, 4 to 12 steps. Merge tiny steps; skip stage directions.',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'One imperative sentence under 30 words that a reviewer who never saw the script can check on its own. Name what must be said or asked, and quote the exact words when the script requires them, e.g. Say "this call is recorded for quality and training purposes" before discussing the account.' },
            critical: { type: 'boolean', description: 'True only for steps a QA team would auto-fail: identity verification, legally required disclosures or consent, required verbatim statements, security checks. Greetings, empathy, recaps and closings are never critical.' },
            critical_reason: { type: 'string', description: 'For critical steps, why in under 12 words. Empty otherwise.' }
          },
          required: ['text', 'critical', 'critical_reason']
        }
      },
      policies: { type: 'array', items: str, description: 'Up to 10 concrete facts the rep must state correctly: timeframes, fees, limits, eligibility rules. Copy numbers exactly.' },
      objections: {
        type: 'array',
        description: 'Up to 6 objections or branches the script covers.',
        items: { type: 'object', properties: { customer_says: str, rep_should: str }, required: ['customer_says', 'rep_should'] }
      },
      keyterms: { type: 'array', items: str, description: 'Up to 15 brand, product and plan names that speech recognition should know.' },
      callers: {
        type: 'array',
        description: 'Exactly three roleplay callers for this script, levels 1, 2 and 3.',
        items: {
          type: 'object',
          properties: {
            level: { type: 'integer', enum: [1, 2, 3] },
            customer_name: { type: 'string', description: 'First and last name.' },
            situation: { type: 'string', description: 'Written to the caller as "you", 3 to 6 sentences: why you are calling, every detail the script verifies (e.g. full name, last four digits, date of birth) so you can answer, and what you want. Level 2: name two of the objections you raise. Level 3: you resist verification at first but give the details once the agent explains why, and you demand something the policy does not allow.' },
            opening_line: { type: 'string', description: 'The first thing the caller says, under 30 words, spoken style. Level 1 polite; levels 2 and 3 upset.' }
          },
          required: ['level', 'customer_name', 'situation', 'opening_line']
        }
      }
    },
    required: ['name', 'role', 'steps', 'policies', 'objections', 'keyterms', 'callers']
  }
};

const INSTRUCTIONS = `You are a contact-center training designer. A company uploaded the call script its reps follow. Extract a playbook from it for roleplay practice, hiring screens and certification.
Base everything on the script. Never invent policies or steps the script does not contain. The callers must be customers this script was written for.
Level 1: a cooperative caller on the main path. Level 2: a frustrated caller who raises the script's objections. Level 3: a hostile caller who pushes against policy and resists verification.`;

const LEVELS: Record<PracticeLevel, { label: string; bar: string; voice: VoiceId }> = {
  1: { label: 'Cooperative caller', bar: 'Practice', voice: 'jane' },
  2: { label: 'Frustrated caller', bar: 'Hiring bar', voice: 'jean' },
  3: { label: 'Hostile caller', bar: 'Certification bar', voice: 'vera' }
};

export async function analyzeScript(apiKey: string, scriptText: string): Promise<Playbook> {
  const text = scriptText.trim().slice(0, MAX_SCRIPT_CHARS);
  if (text.length < 80) throw new Error('That file has too little text to be a call script');
  const raw = await callAgentTool<RawPlaybook>(apiKey, `${INSTRUCTIONS}\n\nCALL SCRIPT:\n"""\n${text}\n"""`, PLAYBOOK_TOOL, 90_000);

  const steps = (raw.steps || []).slice(0, 20);
  const script = steps.map(s => s.text);
  const critical = steps.flatMap((s, i) => (s.critical ? [{ step: i + 1, reason: s.critical_reason }] : []));
  const policies = (raw.policies || []).slice(0, 10);
  const batch = crypto.randomUUID().slice(0, 8);

  const levels: Scenario[] = ([1, 2, 3] as PracticeLevel[]).map(level => {
    const c = raw.callers?.find(x => x.level === level) || raw.callers?.[level - 1];
    if (!c) throw new Error('The analyzer did not return all three callers; try again');
    const meta = LEVELS[level];
    return {
      id: `custom_${batch}_l${level}`,
      title: `${raw.name}: Level ${level}`,
      description: `${meta.label}. ${meta.bar === 'Practice' ? 'Practice run on the main call flow.' : `Scored against the ${meta.bar.toLowerCase()}.`}`,
      difficulty: `Level ${level} · ${meta.bar}`,
      category: 'Custom',
      customerName: c.customer_name,
      persona: c.situation,
      greeting: c.opening_line,
      keyterms: (raw.keyterms || []).slice(0, 15),
      voice: meta.voice,
      script,
      critical: critical.map(c => c.step),
      policies,
      level,
      playbook: raw.name
    };
  });

  return {
    name: raw.name,
    role: raw.role,
    script,
    critical,
    policies,
    objections: (raw.objections || []).slice(0, 6).map(o => ({ customerSays: o.customer_says, repShould: o.rep_should })),
    levels
  };
}
