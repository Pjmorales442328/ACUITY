// Post-call pipeline: Universal-3.5 Pro transcript -> speech metrics -> evaluator agent -> verified scorecard.
import type { Dimension, DimensionScores, Finding, Readiness, Scenario, Scorecard, SpeechMetrics, TranscriptLine } from '../src/types';
import type { CallRecording } from './customerAgent';
import { evaluateCall } from './evaluatorAgent';
import { computeSpeechMetrics, locateQuote, segmentWords, type Segment } from './speechMetrics';
import { transcribeCandidate } from './transcribe';

const MIN_WORDS = 25;

type Assessment = Omit<Scorecard, 'id' | 'createdAt' | 'candidateName' | 'candidateEmail' | 'targetRole'>;

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function buildTimeline(segments: Segment[], rec: CallRecording): TranscriptLine[] {
  const lines: TranscriptLine[] = [
    ...rec.customerTurns.map((t, i) => ({ id: `c${i}`, speaker: 'Customer' as const, text: t.text, atMs: t.atMs })),
    ...segments.map((s, i) => ({ id: `a${i}`, speaker: 'Candidate' as const, text: s.text, atMs: s.startMs }))
  ];
  return lines.sort((a, b) => a.atMs - b.atMs);
}

export function readinessFromScores(scores: DimensionScores): Readiness {
  const values = Object.values(scores);
  if (values.some(v => v <= 2)) return 'NEEDS_TRAINING';
  if (values.every(v => v >= 4)) return 'READY';
  return 'READY_WITH_COACHING';
}

function formatContext(scenario: Scenario, metrics: SpeechMetrics, timeline: TranscriptLine[]) {
  return `SCENARIO: ${scenario.title}. ${scenario.description}

OBJECTIVE SPEECH METRICS (measured by AssemblyAI Universal-3.5 Pro from the candidate's audio):
- Speaking pace: ${metrics.wordsPerMinute} words per minute (conversational English is roughly 120-160)
- Filler words: ${metrics.fillerCount} (${metrics.fillersPer100Words} per 100 words)
- Hesitation pauses (0.8-2.5s mid-answer): ${metrics.hesitationPauses}
- Average word recognition confidence: ${metrics.avgWordConfidence} (lower suggests unclear pronunciation)
- Unclear words: ${metrics.unclearWords.join(', ') || 'none'}

TRANSCRIPT:
${timeline.map(l => `[${clock(l.atMs)}] ${l.speaker === 'Customer' ? 'CUSTOMER' : 'CANDIDATE'}: ${l.text}`).join('\n')}`;
}

export async function assessCall(apiKey: string, scenario: Scenario, rec: CallRecording): Promise<Assessment> {
  const words = await transcribeCandidate(apiKey, rec.micAudio, scenario.keyterms);
  const metrics = computeSpeechMetrics(words);
  // A customer fragment the candidate talked over doesn't end the candidate's turn.
  const segments = segmentWords(words, rec.customerTurns.filter(t => !t.interrupted).map(t => t.atMs));
  const transcript = buildTimeline(segments, rec);
  const base = {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    durationSeconds: Math.round(rec.durationMs / 1000),
    metrics,
    transcript
  };

  if (metrics.wordCount < MIN_WORDS) {
    return {
      ...base,
      readiness: 'INSUFFICIENT_SAMPLE',
      cefr: null,
      cefrRationale: '',
      dimensionScores: null,
      customerOutcome: null,
      summary: `Only ${metrics.wordCount} words were captured from the candidate, which is too little speech for a fair assessment.`,
      findings: [],
      rejectedFindings: 0
    };
  }

  const ev = await evaluateCall(apiKey, formatContext(scenario, metrics, transcript));
  const scores: DimensionScores = {
    EMPATHY: ev.dimension_scores.empathy,
    OWNERSHIP: ev.dimension_scores.ownership,
    ACCURACY: ev.dimension_scores.accuracy,
    CLARITY: ev.dimension_scores.clarity,
    LANGUAGE: ev.dimension_scores.language
  };

  // Keep only findings whose quote really appears in what the candidate said, anchored to when they said it.
  const findings: Finding[] = [];
  for (const f of ev.findings || []) {
    const atMs = locateQuote(words, f.quote);
    if (atMs !== null) findings.push({ dimension: f.dimension as Dimension, impact: f.impact, quote: f.quote, coaching: f.coaching, atMs });
  }

  return {
    ...base,
    readiness: readinessFromScores(scores),
    cefr: ev.cefr,
    cefrRationale: ev.cefr_rationale,
    dimensionScores: scores,
    customerOutcome: ev.customer_outcome,
    summary: ev.summary,
    findings,
    rejectedFindings: (ev.findings?.length || 0) - findings.length
  };
}
