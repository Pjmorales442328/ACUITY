// Shared domain types used by both the React client and the Express server.

export type CefrLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type Readiness = 'READY' | 'READY_WITH_COACHING' | 'NEEDS_TRAINING' | 'INSUFFICIENT_SAMPLE';

export type Dimension = 'EMPATHY' | 'OWNERSHIP' | 'ACCURACY' | 'CLARITY' | 'LANGUAGE';

export type CustomerOutcome = 'RESOLVED_AND_CALMED' | 'PARTIALLY_DE_ESCALATED' | 'UNRESOLVED_ESCALATED';

export type VoiceId =
  | 'alba' | 'eve' | 'george' | 'jane' | 'jean' | 'mary' | 'michael'
  | 'anna' | 'charles' | 'paul' | 'vera';

export type ScenarioCategory = 'Fintech' | 'E-Commerce' | 'Telecom' | 'Hospitality' | 'Technical Support' | 'Custom';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: ScenarioCategory;
  customerName: string;
  persona: string;
  greeting: string;
  keyterms: string[];
  voice: VoiceId;
}

export interface CandidateProfile {
  candidateName: string;
  candidateEmail: string;
  targetRole: string;
}

export interface TranscriptLine {
  id: string;
  speaker: 'Customer' | 'Candidate';
  text: string;
  atMs: number;
}

export interface SpeechMetrics {
  wordCount: number;
  speakingSeconds: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillersPer100Words: number;
  hesitationPauses: number;
  avgWordConfidence: number;
  unclearWords: string[];
}

export interface Finding {
  dimension: Dimension;
  impact: 'POSITIVE' | 'NEGATIVE';
  quote: string;
  atMs: number;
  coaching: string;
}

export type DimensionScores = Record<Dimension, number>;

export interface Scorecard extends CandidateProfile {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: string;
  durationSeconds: number;
  readiness: Readiness;
  cefr: CefrLevel | null;
  cefrRationale: string;
  dimensionScores: DimensionScores | null;
  customerOutcome: CustomerOutcome | null;
  summary: string;
  findings: Finding[];
  rejectedFindings: number;
  metrics: SpeechMetrics;
  transcript: TranscriptLine[];
}

export type ActiveTab = 'SCREENING' | 'CANDIDATES' | 'SCENARIOS' | 'ARCHITECTURE_DECK';
