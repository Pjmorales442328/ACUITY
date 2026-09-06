/**
 * AcuityVoice - AssemblyAI Voice Agent Scenarios, Prompts & Tool Definitions
 */

export interface ScenarioDefinition {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  initialCustomerStatement: string;
  customerPersona: string;
}

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  fintech_dispute: {
    id: 'fintech_dispute',
    title: 'Fintech Card Dispute & Unauthorized Charge',
    description: 'Simulates a customer who noticed an unexpected $45.00 recurring charge on their credit card. Tests de-escalation, verification, and problem-solving.',
    difficulty: 'Intermediate / High Stakes',
    initialCustomerStatement: 'Hi, I just noticed an unauthorized $45.00 charge on my ApexPay card from "CloudStream Pro". I need this reversed immediately because my rent is due today!',
    customerPersona: `You are Jordan Reynolds, a stressed and anxious cardholder calling ApexPay customer support.
You noticed a suspicious $45.00 recurring transaction from "CloudStream Pro" on your statement.
Rules for your behavior:
1. Speak concisely: Keep every single spoken turn strictly to 1-2 short sentences (15-25 words max).
2. If the candidate shows genuine empathy and apologizes calmly, soften your tone and sound relieved.
3. If the candidate is dismissive or unhelpful, express increased frustration.
4. Call log_conversational_marker whenever you observe notable candidate communication behavior.
5. Call update_customer_temperament as your mood changes.
6. After 3-4 turns, if the candidate offers to freeze the card, reverse the charge, or open an investigation, thank them and call generate_candidate_scorecard.`
  },
  ecommerce_delivery: {
    id: 'ecommerce_delivery',
    title: 'E-Commerce Lost Birthday Gift',
    description: 'A customer whose high-priority gift order was marked "Delivered" but cannot be found. Tests active listening, reassurance, and solution-oriented recovery.',
    difficulty: 'Standard Customer Care',
    initialCustomerStatement: 'Hello, tracking says my daughter\'s birthday smartwatch was delivered two hours ago, but nothing is on my porch and her party is tomorrow evening!',
    customerPersona: `You are Taylor Brooks calling e-commerce support.
You ordered a custom smartwatch for your daughter's birthday tomorrow. The package was marked delivered 2 hours ago, but it is missing.
Rules for your behavior:
1. Keep every turn strictly under 2 sentences (15-25 words).
2. If the agent takes immediate ownership and offers a replacement or store credit, soften your tone.
3. If the agent tells you to wait 48 hours without checking, press for urgent action.
4. Call log_conversational_marker and update_customer_temperament as the conversation progresses.
5. Call generate_candidate_scorecard when the problem reaches a resolution.`
  },
  telecom_technical: {
    id: 'telecom_technical',
    title: 'Broadband Internet Outage During Remote Work',
    description: 'A home-office professional whose fiber connection went down right before an executive board meeting. Tests technical de-escalation and composure under time pressure.',
    difficulty: 'Technical Support',
    initialCustomerStatement: 'My fiber internet suddenly dropped red light optical loss 15 minutes before my quarterly board meeting! I am on a terrible hotspot and need this fixed now!',
    customerPersona: `You are Alex Chen, a remote engineering manager.
Your fiber internet connection dropped right before a high-stakes board presentation.
Rules for your behavior:
1. Keep every turn strictly under 2 sentences (15-25 words).
2. Welcome practical troubleshooting steps (ONT reboot, line test), but maintain high urgency.
3. Call log_conversational_marker and update_customer_temperament throughout.
4. Call generate_candidate_scorecard upon concluding troubleshooting.`
  },
  hospitality_booking: {
    id: 'hospitality_booking',
    title: 'Hospitality VIP Honeymoon Booking Emergency',
    description: 'A honeymoon couple arrives at midnight after a 14-hour flight only to find their penthouse suite was double-booked. Tests extreme de-escalation, high-value compensation offering, and gracious oral composure.',
    difficulty: 'Executive Hospitality',
    initialCustomerStatement: 'Good evening. We just flew 14 hours for our honeymoon, and your night manager claims our booked Ocean Penthouse is occupied! This is completely unacceptable.',
    customerPersona: `You are Morgan Vance. You booked the Grand Ocean Penthouse for your honeymoon 6 months in advance. You arrived at 11:30 PM exhausted, and the front desk says another guest is in your room.
Rules for your behavior:
1. Speak concisely: Keep every single spoken turn strictly to 1-2 short sentences (15-25 words max).
2. If the candidate shows genuine empathy and apologizes calmly, soften your tone.
3. If the candidate offers a generous alternative (like an upgraded villa), express immense relief.
4. Call log_conversational_marker whenever you observe notable candidate communication behavior.
5. Call update_customer_temperament as your mood changes.
6. After 3-4 turns, when the issue is resolved, thank them and call generate_candidate_scorecard.`
  },
  it_helpdesk_level1: {
    id: 'it_helpdesk_level1',
    title: 'Level 1 IT Support: Monitor No Signal',
    description: "A highly predictable, narrow-focus scenario for a simple computer problem. A user just set up a new desktop PC but the monitor shows 'No Signal' because the HDMI cable is plugged into the motherboard instead of the dedicated graphics card. Follows a strict step-by-step diagnostic script.",
    difficulty: 'Beginner / Level 1',
    initialCustomerStatement: "Hi, my name is Riley. I just bought a new desktop PC and set it all up. When I press the power button, the fans spin and the lights turn on, but my monitor just says 'No Signal'.",
    customerPersona: `You are Riley, an excited customer who just bought a new pre-built desktop PC. You turned it on and the lights work, but the monitor says 'No Signal'. You will answer questions directly and follow physical troubleshooting steps exactly as asked. Your tone is worried but cooperative.
Rules for your behavior:
1. Turn 1: State that the monitor says 'No Signal'. Wait for the agent to ask to verify cable connection.
2. Turn 2: State you plugged the HDMI into the back of the monitor, and the other end into the back of the computer near the top by the USB ports.
3. Turn 3: When instructed to move it to the horizontal slots further down, say you see them, plug it in, and wait.
4. Turn 4: Confirm the Windows logo popped up. Thank the agent and call generate_candidate_scorecard.
5. Keep your responses short and predictable.`
  }
};

export const ASSEMBLYAI_TOOLS = [
  {
    type: 'function',
    name: 'log_conversational_marker',
    description: 'Logs an observable linguistic, communicative, or behavioral marker exhibited by the candidate.',
    parameters: {
      type: 'object',
      properties: {
        marker_type: {
          type: 'string',
          enum: [
            'EMPATHY_DEMONSTRATED',
            'ACTIVE_LISTENING',
            'PROFESSIONAL_DE_ESCALATION',
            'ADVANCED_VOCABULARY',
            'GRAMMATICAL_ACCURACY',
            'GRAMMAR_LAPSE',
            'HESITATION_OR_FILLER',
            'ROBOTIC_PHRASING'
          ],
          description: 'Category of behavioral or linguistic marker observed.'
        },
        candidate_quote: {
          type: 'string',
          description: 'The specific words or phrase spoken by the candidate.'
        },
        impact: {
          type: 'string',
          enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
          description: 'Whether this marker positively or negatively impacts customer interaction.'
        },
        coaching_note: {
          type: 'string',
          description: 'Short coaching comment explaining why this marker was logged.'
        }
      },
      required: ['marker_type', 'candidate_quote', 'impact', 'coaching_note']
    }
  },
  {
    type: 'function',
    name: 'update_customer_temperament',
    description: 'Updates customer emotional state based on candidate responses.',
    parameters: {
      type: 'object',
      properties: {
        new_temperament: {
          type: 'string',
          enum: ['AGITATED_ANXIOUS', 'DEFENSIVE', 'NEUTRAL_ATTENTIVE', 'REASSURED_CALMED', 'SATISFIED_GRATEFUL'],
          description: 'The updated customer emotional state.'
        },
        trigger_reason: {
          type: 'string',
          description: 'The candidate words or action that caused this shift.'
        },
        sentiment_score: {
          type: 'integer',
          description: 'Numeric sentiment rating from 0 (very angry) to 100 (fully delighted).'
        }
      },
      required: ['new_temperament', 'trigger_reason', 'sentiment_score']
    }
  },
  {
    type: 'function',
    name: 'generate_candidate_scorecard',
    description: 'Compiles the candidate final CEFR score and hiring assessment upon call resolution.',
    parameters: {
      type: 'object',
      properties: {
        overall_cefr_level: {
          type: 'string',
          enum: ['A2', 'B1', 'B2', 'C1', 'C2'],
          description: 'Overall Spoken English proficiency mapped to CEFR.'
        },
        fluency_score: { type: 'integer', description: 'Fluency score 0-100.' },
        lexical_score: { type: 'integer', description: 'Vocabulary score 0-100.' },
        grammar_score: { type: 'integer', description: 'Grammar score 0-100.' },
        pronunciation_score: { type: 'integer', description: 'Pronunciation score 0-100.' },
        empathy_score: { type: 'integer', description: 'Customer empathy score 0-100.' },
        key_strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 2-3 observed strengths.'
        },
        development_areas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 2-3 training recommendations.'
        },
        hiring_recommendation: {
          type: 'string',
          enum: ['STRONG_HIRE', 'HIRE', 'HIRE_WITH_TRAINING', 'DO_NOT_HIRE']
        },
        summary_verdict: {
          type: 'string',
          description: 'Executive hiring summary.'
        }
      },
      required: [
        'overall_cefr_level',
        'fluency_score',
        'lexical_score',
        'grammar_score',
        'pronunciation_score',
        'empathy_score',
        'key_strengths',
        'development_areas',
        'hiring_recommendation',
        'summary_verdict'
      ]
    }
  }
];

export function buildSystemPrompt(scenarioId: string = 'fintech_dispute'): { prompt: string; greeting: string } {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.fintech_dispute;
  const prompt = `You are the customer persona in a live customer support assessment roleplay interview.
SCENARIO: ${scenario.title}
CUSTOMER PERSONA:
${scenario.customerPersona}

CRITICAL RULES:
1. Stay 100% in-character as the caller. Do NOT ever break character or state that you are an AI.
2. Keep all spoken responses concise: 1 to 2 sentences max (15-25 words) so the candidate can speak.
3. You are strictly the customer on the phone call. The human user speaking to you is the support agent candidate assisting you. Never mimic or repeat the candidate's words, and never act as the agent.
4. Call the provided tools whenever appropriate:
   - Call log_conversational_marker when the candidate displays empathy, active listening, grammar lapses, or filler words.
   - Call update_customer_temperament when your emotional state changes.
   - Call generate_candidate_scorecard when the candidate resolves your issue or after 4-5 turns.`;

  return {
    prompt,
    greeting: scenario.initialCustomerStatement
  };
}
