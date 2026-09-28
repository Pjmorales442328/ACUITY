// JSON-Schema tools the analyzer agent fills in: first a client playbook split into call types with their flow and rules, then three callers per call type.

export interface RawCallType {
  name: string;
  steps: { text: string; critical: boolean; critical_reason: string }[];
  policies: string[];
  objections: { customer_says: string; rep_should: string }[];
}

export interface RawCaller {
  level: number;
  customer_name: string;
  situation: string;
  opening_line: string;
}

export interface RawPlaybook {
  name: string;
  role: string;
  keyterms: string[];
  call_types: RawCallType[];
}

const str = { type: 'string' };

const CALL_TYPE = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short call type name, e.g. "Lost or stolen card".' },
    steps: {
      type: 'array',
      description: 'The full call flow for this call type, in order, 5 to 10 steps. Include the standards every call needs (greeting, disclosures, verification, closing) as their own steps. Merge tiny steps.',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'One imperative sentence under 30 words that a reviewer who never saw the playbook can check on its own. Quote exact words when the playbook requires them.' },
          critical: { type: 'boolean', description: 'True only for steps the playbook marks as auto-fail or that are legally required: disclosures, identity verification, required verbatim statements, security actions. Greetings, empathy, recaps and closings are never critical.' },
          critical_reason: { type: 'string', description: 'For critical steps, why in under 12 words. Empty otherwise.' }
        },
        required: ['text', 'critical', 'critical_reason']
      }
    },
    policies: { type: 'array', items: str, description: 'Up to 6 concrete facts for this call type the rep must state correctly: timeframes, fees, limits. Copy numbers exactly.' },
    objections: {
      type: 'array',
      description: 'Up to 3 objections a caller of this type is likely to raise, from the playbook.',
      items: { type: 'object', properties: { customer_says: str, rep_should: str }, required: ['customer_says', 'rep_should'] }
    }
  },
  required: ['name', 'steps', 'policies', 'objections']
};

export const PLAYBOOK_TOOL = {
  name: 'submit_playbook',
  description: 'Submit the playbook extracted from the document. Call this exactly once, when instructed.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Client and program name, e.g. "ApexPay Card Services".' },
      role: { type: 'string', description: 'The job the rep does on these calls, e.g. "Card servicing agent".' },
      keyterms: { type: 'array', items: str, description: 'Up to 15 brand, product and plan names that speech recognition should know.' },
      call_types: { type: 'array', description: 'Every distinct call type the playbook covers, 1 to 4. A document with a single call flow has one.', items: CALL_TYPE }
    },
    required: ['name', 'role', 'keyterms', 'call_types']
  }
};

export const CALLERS_TOOL = {
  name: 'submit_callers',
  description: 'Submit the three roleplay callers. Call this exactly once, when instructed.',
  parameters: {
    type: 'object',
    properties: {
      callers: {
        type: 'array',
        description: 'Exactly three roleplay callers for this call type, levels 1, 2 and 3.',
        items: {
          type: 'object',
          properties: {
            level: { type: 'integer', enum: [1, 2, 3] },
            customer_name: { type: 'string', description: 'An ordinary, realistic first and last name, different for every caller. No famous or joke names.' },
            situation: { type: 'string', description: 'Written to the caller as "you", 3 to 5 sentences: why you are calling, every detail the playbook verifies (full name, last four digits, date of birth) so you can answer, realistic specifics (a real-sounding merchant, amount and date), and what you want. Level 2: name two objections you raise. Level 3: you resist verification at first and demand something the policy does not allow.' },
            opening_line: { type: 'string', description: 'The first thing the caller says, under 25 words, spoken style. Level 1 polite; levels 2 and 3 upset.' }
          },
          required: ['level', 'customer_name', 'situation', 'opening_line']
        }
      }
    },
    required: ['callers']
  }
};
