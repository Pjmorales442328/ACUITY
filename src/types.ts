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
  script: string[]; // the company's call script: steps the rep must cover, in order (empty = no script)
  critical?: number[]; // 1-based script steps that fail the call when missed (verification, legal disclosures)
  policies?: string[]; // facts from the script the rep must state correctly (timeframes, fees, limits)
  level?: PracticeLevel; // set on scenarios generated from an uploaded script
  playbook?: string; // name of the playbook those levels came from
}

// 1 = cooperative caller (practice), 2 = frustrated with objections (hiring bar), 3 = hostile, pushes policy (certification bar)
export type PracticeLevel = 1 | 2 | 3;

// One call type from an analyzed playbook (e.g. "Lost or stolen card"), shown for review before its levels are saved.
export interface CallType {
  name: string;
  script: string[];
  critical: { step: number; reason: string }[];
  policies: string[];
  objections: { customerSays: string; repShould: string }[];
  levels: Scenario[];
}

// What the analyzer extracted from an uploaded client playbook: one entry per call type it covers.
export interface Playbook {
  name: string;
  role: string;
  callTypes: CallType[];
}

export interface BarResult {
  name: 'Hiring bar' | 'Certification bar';
  passed: boolean;
  reasons: string[]; // why it failed; empty when passed
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

export type StepStatus = 'DONE' | 'PARTIAL' | 'MISSED';

export interface ScriptStep {
  step: string;
  status: StepStatus;
  quote: string | null;
  atMs: number | null;
  critical?: boolean;
}

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
  scriptSteps: ScriptStep[];
  scriptAdherence: number | null; // 0-100, computed in code from scriptSteps
  bar?: BarResult | null; // pass/fail against the level's hiring or certification criteria
  metrics: SpeechMetrics;
  transcript: TranscriptLine[];
}

// Demo calls: which AI rep takes the call instead of the microphone.
export type DemoRepStyle = 'strong' | 'trainee';

export type ActiveTab = 'SCREENING' | 'CANDIDATES' | 'SCENARIOS' | 'ARCHITECTURE_DECK';
