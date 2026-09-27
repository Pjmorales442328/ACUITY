// Sanitizes scenario and candidate data arriving from the browser before it reaches AssemblyAI.
import type { CandidateProfile, Scenario, ScenarioCategory, VoiceId } from '../src/types';

const VOICES: VoiceId[] = ['alba', 'eve', 'george', 'jane', 'jean', 'mary', 'michael', 'anna', 'charles', 'paul', 'vera'];
const CATEGORIES: ScenarioCategory[] = ['Fintech', 'E-Commerce', 'Telecom', 'Hospitality', 'Technical Support', 'Custom'];

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseScenario(raw: any): Scenario | null {
  const s: Scenario = {
    id: str(raw?.id, 80),
    title: str(raw?.title, 120),
    description: str(raw?.description, 600),
    difficulty: str(raw?.difficulty, 60),
    category: CATEGORIES.includes(raw?.category) ? raw.category : 'Custom',
    customerName: str(raw?.customerName, 60),
    persona: str(raw?.persona, 2000),
    greeting: str(raw?.greeting, 400),
    keyterms: Array.isArray(raw?.keyterms)
      ? raw.keyterms.map((k: unknown) => str(k, 50)).filter(Boolean).slice(0, 50)
      : [],
    voice: VOICES.includes(raw?.voice) ? raw.voice : 'anna',
    script: Array.isArray(raw?.script) ? raw.script.map((k: unknown) => str(k, 300)).filter(Boolean).slice(0, 20) : []
  };
  return s.id && s.title && s.customerName && s.persona && s.greeting ? s : null;
}

export function parseProfile(raw: any): CandidateProfile {
  return {
    candidateName: str(raw?.candidateName, 120) || 'Unnamed candidate',
    candidateEmail: str(raw?.candidateEmail, 120),
    targetRole: str(raw?.targetRole, 120)
  };
}
