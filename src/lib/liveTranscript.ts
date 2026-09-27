// Pure helpers that fold streaming Voice Agent transcript events into a list of display lines.
export interface LiveLine {
  id: string;
  speaker: 'Customer' | 'Candidate';
  text: string;
  final: boolean;
}

const FILLER_RE = /\b(um+|uh+|erm|er|ah|hmm)\b/gi;

export const countFillers = (text: string) => (text.match(FILLER_RE) || []).length;

export function appendAgentDelta(lines: LiveLine[], id: string, delta: string): LiveLine[] {
  const i = lines.findIndex(l => l.id === id);
  if (i === -1) return [...lines, { id, speaker: 'Customer', text: delta, final: false }];
  const text = lines[i].text ? `${lines[i].text} ${delta}` : delta;
  return lines.map((l, j) => (j === i ? { ...l, text } : l));
}

export function finalizeAgentLine(lines: LiveLine[], id: string, text: string): LiveLine[] {
  if (!text.trim()) return lines.filter(l => l.id !== id);
  const exists = lines.some(l => l.id === id);
  const line: LiveLine = { id, speaker: 'Customer', text, final: true };
  return exists ? lines.map(l => (l.id === id ? line : l)) : [...lines, line];
}

export function addCandidateLine(lines: LiveLine[], id: string, text: string): LiveLine[] {
  if (!text.trim() || lines.some(l => l.id === id)) return lines;
  return [...lines, { id, speaker: 'Candidate', text, final: true }];
}
