// Deterministic speaking metrics computed from AssemblyAI word-level timestamps and confidence.
import type { SpeechMetrics } from '../src/types';

export interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Segment {
  startMs: number;
  endMs: number;
  text: string;
}

const FILLERS = new Set(['um', 'uh', 'er', 'erm', 'ah', 'hmm', 'mm', 'uhm']);
// Gaps this long mean the candidate stopped talking (the customer was speaking or the line was idle).
const TURN_GAP_MS = 2500;
const HESITATION_GAP_MS = 800;
const UNCLEAR_CONFIDENCE = 0.6;

const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');

// "like," with a trailing comma is how Universal-3.5 Pro marks filler usage of "like".
const isFiller = (w: Word) => FILLERS.has(bare(w.text)) || /^like,$/i.test(w.text.trim());

const NUMBERS: Record<string, string> = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
// Number words and digits compare equal, so "last four digits" matches a transcript that wrote "last 4 digits".
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean).map(t => NUMBERS[t] || t);

function findRun(spoken: string[], q: string[]): number {
  for (let i = 0; i + q.length <= spoken.length; i++) {
    if (q.every((t, j) => spoken[i + j] === t)) return i;
  }
  return -1;
}

// Start time of `quote` if it appears verbatim in the spoken words, else null.
// A quote the model stitched from several sentences passes only if every sentence appears verbatim.
export function locateQuote(words: Word[], quote: string): number | null {
  const spoken = words.map(w => tokens(w.text).join(''));
  const q = tokens(quote);
  if (!q.length) return null;
  const whole = findRun(spoken, q);
  if (whole >= 0) return words[whole].start;
  const parts = quote.split(/[.?!]+/).map(tokens).filter(p => p.length);
  if (parts.length < 2) return null;
  const hits = parts.map(p => findRun(spoken, p));
  return hits.every(h => h >= 0) ? words[Math.min(...hits)].start : null;
}

// Groups words into utterances, splitting on long silences and wherever the customer spoke in between.
export function segmentWords(words: Word[], breakpointsMs: number[] = []): Segment[] {
  const segments: Segment[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (!current.length) return;
    segments.push({
      startMs: current[0].start,
      endMs: current[current.length - 1].end,
      text: current.map(w => w.text).join(' ')
    });
    current = [];
  };
  for (const w of words) {
    const prev = current[current.length - 1];
    const customerSpokeBetween = prev && breakpointsMs.some(b => b > prev.start && b <= w.start);
    if (prev && (w.start - prev.end >= TURN_GAP_MS || customerSpokeBetween)) flush();
    current.push(w);
  }
  flush();
  return segments;
}

export function computeSpeechMetrics(words: Word[]): SpeechMetrics {
  const segments = segmentWords(words);
  const speakingMs = segments.reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  let hesitationPauses = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= HESITATION_GAP_MS && gap < TURN_GAP_MS) hesitationPauses++;
  }
  const fillerCount = words.filter(isFiller).length;
  const unclear = [...new Set(
    words.filter(w => w.confidence < UNCLEAR_CONFIDENCE).map(w => bare(w.text)).filter(Boolean)
  )].slice(0, 8);
  const avg = words.length ? words.reduce((s, w) => s + w.confidence, 0) / words.length : 0;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    wordCount: words.length,
    speakingSeconds: round1(speakingMs / 1000),
    wordsPerMinute: speakingMs > 0 ? Math.round(words.length / (speakingMs / 60000)) : 0,
    fillerCount,
    fillersPer100Words: words.length ? round1((fillerCount / words.length) * 100) : 0,
    hesitationPauses,
    avgWordConfidence: Math.round(avg * 100) / 100,
    unclearWords: unclear
  };
}
