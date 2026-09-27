export type CefrLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type HiringRecommendation = 'STRONG_HIRE' | 'HIRE' | 'HIRE_WITH_TRAINING' | 'DO_NOT_HIRE';

export type MarkerType =
  | 'EMPATHY_DEMONSTRATED'
  | 'ACTIVE_LISTENING'
  | 'PROFESSIONAL_DE_ESCALATION'
  | 'ADVANCED_VOCABULARY'
  | 'GRAMMATICAL_ACCURACY'
  | 'GRAMMAR_LAPSE'
  | 'HESITATION_OR_FILLER'
  | 'ROBOTIC_PHRASING';

export type MarkerImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type TemperamentType =
  | 'AGITATED_ANXIOUS'
  | 'DEFENSIVE'
  | 'NEUTRAL_ATTENTIVE'
  | 'REASSURED_CALMED'
  | 'SATISFIED_GRATEFUL';

export interface ConversationalMarker {
  id: string;
  markerType: MarkerType;
  candidateQuote: string;
  impact: MarkerImpact;
  coachingNote: string;
  timestamp: number;
}

export interface ScenarioTurn {
  customerText: string;
  expectedCandidateTopic: string;
  sentimentScore: number;
  temperament: TemperamentType;
  temperamentReason: string;
  sampleMarker?: {
    markerType: MarkerType;
    candidateQuote: string;
    impact: MarkerImpact;
    coachingNote: string;
  };
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: 'Fintech' | 'E-Commerce' | 'Telecom' | 'Hospitality' | 'Healthcare' | 'Technical Support' | 'Custom';
  customerPersona: string;
  initialSentiment: number;
  initialTemperament: TemperamentType;
  scriptedTurns: ScenarioTurn[];
}

export interface RadarScores {
  fluency: number;
  grammar: number;
  lexical: number;
  pronunciation: number;
  empathy: number;
}

export interface Scorecard {
  id: string;
  candidateName: string;
  candidateEmail: string;
  targetRole: string;
  scenarioId: string;
  scenarioTitle: string;
  overallCefrLevel: CefrLevel;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  empathyScore: number;
  keyStrengths: string[];
  developmentAreas: string[];
  hiringRecommendation: HiringRecommendation;
  summaryVerdict: string;
  sessionDurationSeconds: number;
  turnCount: number;
  markersCount: number;
  createdAt: string;
  transcript?: TranscriptMessage[];
  // Customer Sentiment & De-escalation Audit Fields
  initialSentimentScore?: number;
  finalSentimentScore?: number;
  initialTemperament?: TemperamentType;
  finalTemperament?: TemperamentType;
  deEscalationOutcome?: 'RESOLVED_AND_CALMED' | 'PARTIALLY_DE_ESCALATED' | 'UNRESOLVED_ESCALATED';
  deEscalationNotes?: string;
}

export interface TranscriptMessage {
  id: string;
  speaker: 'AI Customer' | 'Candidate' | 'System';
  speakerName?: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  markers?: ConversationalMarker[];
}

export type AppMode = 'MOCK' | 'GEMINI_AI' | 'ASSEMBLYAI';
export type ActiveTab = 'SCREENING' | 'CANDIDATES' | 'SCENARIOS' | 'ARCHITECTURE_DECK';
