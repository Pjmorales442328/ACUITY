// Runs a short AssemblyAI Voice Agent session whose JSON-Schema tool call returns the structured assessment.
import WebSocket from 'ws';

const VOICE_AGENT_URL = 'wss://agents.assemblyai.com/v1/ws';
const TIMEOUT_MS = 45_000;
const DIMENSIONS = ['EMPATHY', 'OWNERSHIP', 'ACCURACY', 'CLARITY', 'LANGUAGE'];
const score = { type: 'integer', description: '1 (poor) to 5 (excellent), per the rubric anchors.' };

export interface RawEvaluation {
  readiness: 'READY' | 'READY_WITH_COACHING' | 'NEEDS_TRAINING';
  cefr: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  cefr_rationale: string;
  dimension_scores: Record<'empathy' | 'ownership' | 'accuracy' | 'clarity' | 'language', number>;
  customer_outcome: 'RESOLVED_AND_CALMED' | 'PARTIALLY_DE_ESCALATED' | 'UNRESOLVED_ESCALATED';
  summary: string;
  findings: { dimension: string; impact: 'POSITIVE' | 'NEGATIVE'; quote: string; coaching: string }[];
  script_steps?: { step_number: number; status: 'DONE' | 'PARTIAL' | 'MISSED'; quote: string }[];
}

// Only sent when the scenario has a company call script.
const SCRIPT_STEPS_PROP = {
  type: 'array',
  description: 'One entry per numbered SCRIPT step, in order.',
  items: {
    type: 'object',
    properties: {
      step_number: { type: 'integer' },
      status: { type: 'string', enum: ['DONE', 'PARTIAL', 'MISSED'], description: 'DONE = fully covered, PARTIAL = attempted or incomplete, MISSED = not covered.' },
      quote: { type: 'string', description: 'For DONE or PARTIAL: the CANDIDATE words, copied exactly, that cover the step. Empty for MISSED.' }
    },
    required: ['step_number', 'status', 'quote']
  }
};

const SUBMIT_TOOL = {
  type: 'function',
  name: 'submit_assessment',
  description: 'Submit the final assessment of the CANDIDATE. Call this exactly once, when instructed.',
  execution_mode: 'hold',
  parameters: {
    type: 'object',
    properties: {
      readiness: { type: 'string', enum: ['READY', 'READY_WITH_COACHING', 'NEEDS_TRAINING'] },
      cefr: { type: 'string', enum: ['A2', 'B1', 'B2', 'C1', 'C2'], description: 'Spoken English level on the CEFR scale.' },
      cefr_rationale: { type: 'string', description: 'One sentence citing the evidence for the CEFR level.' },
      dimension_scores: {
        type: 'object',
        properties: { empathy: score, ownership: score, accuracy: score, clarity: score, language: score },
        required: ['empathy', 'ownership', 'accuracy', 'clarity', 'language']
      },
      customer_outcome: { type: 'string', enum: ['RESOLVED_AND_CALMED', 'PARTIALLY_DE_ESCALATED', 'UNRESOLVED_ESCALATED'] },
      summary: { type: 'string', description: 'Two sentences for a hiring manager.' },
      findings: {
        type: 'array',
        description: '3 to 6 findings, both strengths and problems.',
        items: {
          type: 'object',
          properties: {
            dimension: { type: 'string', enum: DIMENSIONS },
            impact: { type: 'string', enum: ['POSITIVE', 'NEGATIVE'] },
            quote: { type: 'string', description: 'Copied word for word from a CANDIDATE line. Never paraphrase.' },
            coaching: { type: 'string', description: 'One sentence of specific coaching.' }
          },
          required: ['dimension', 'impact', 'quote', 'coaching']
        }
      }
    },
    required: ['readiness', 'cefr', 'cefr_rationale', 'dimension_scores', 'customer_outcome', 'summary', 'findings']
  }
};

const RUBRIC = `You are a strict, fair QA assessor for a BPO contact center. You evaluate the CANDIDATE (the support agent) in a roleplay call with a simulated CUSTOMER.

Score each dimension 1-5:
- EMPATHY: 5 = names the customer's specific concern and emotion; 1 = ignores or dismisses feelings.
- OWNERSHIP: 5 = takes responsibility and commits to concrete next steps; 1 = blames policy, deflects.
- ACCURACY: 5 = consistent, realistic information; 1 = contradicts itself or overpromises.
- CLARITY: 5 = structured, concise, easy to follow; 1 = rambling or confusing.
- LANGUAGE: 5 = accurate grammar and professional vocabulary; 1 = frequent errors that impede meaning.

Readiness: READY if every dimension is 4+; NEEDS_TRAINING if any dimension is 2 or lower; otherwise READY_WITH_COACHING.
Use the objective speech metrics for fluency evidence. Filler words in the transcript are real (the transcript keeps disfluencies).
Every finding's quote must be copied exactly from a CANDIDATE line.`;

function submitTool(withScript: boolean) {
  if (!withScript) return SUBMIT_TOOL;
  const p = SUBMIT_TOOL.parameters;
  return { ...SUBMIT_TOOL, parameters: { ...p, properties: { ...p.properties, script_steps: SCRIPT_STEPS_PROP }, required: [...p.required, 'script_steps'] } };
}

export function evaluateCall(apiKey: string, context: string, withScript: boolean): Promise<RawEvaluation> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(VOICE_AGENT_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
    const finish = (fn: () => void) => {
      clearTimeout(timer);
      try {
        ws.close(1000);
      } catch {}
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('Evaluator agent timed out'))), TIMEOUT_MS);

    ws.on('open', () => ws.send(JSON.stringify({
      type: 'session.update',
      session: { system_prompt: `${RUBRIC}\n\n${context}`, tools: [submitTool(withScript)] }
    })));
    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'session.ready') {
        ws.send(JSON.stringify({ type: 'reply.create', instructions: 'Call submit_assessment now with your complete assessment. Do not speak.' }));
      } else if (m.type === 'tool.call' && m.name === 'submit_assessment') {
        finish(() => resolve(m.arguments as RawEvaluation));
      } else if (m.type === 'session.error' || m.type === 'error') {
        finish(() => reject(new Error(`Evaluator agent error: ${m.message}`)));
      }
    });
    ws.on('error', err => finish(() => reject(err)));
  });
}
