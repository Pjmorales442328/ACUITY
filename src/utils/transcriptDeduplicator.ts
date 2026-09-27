import { TranscriptMessage } from '../types';

/**
 * Normalizes text for linguistic comparison (strips punctuation, extra spaces, casing)
 */
function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates word overlap ratio between two strings
 */
function getWordOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(normalizeForComparison(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeForComparison(b).split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let intersection = 0;
  wordsB.forEach(w => {
    if (wordsA.has(w)) intersection++;
  });
  return intersection / Math.min(wordsA.size, wordsB.size);
}

/**
 * Deduplicates and consolidates transcript messages to prevent
 * duplicated customer turns, overlapping STT chunks, or fragment echoes.
 */
export function cleanAndDeduplicateTranscript(messages: TranscriptMessage[]): TranscriptMessage[] {
  if (!messages || messages.length === 0) return [];
  if (messages.length === 1) return messages;

  const result: TranscriptMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const curr = messages[i];
    const currTrim = (curr.text || '').trim();
    if (!currTrim && curr.speaker !== 'System') continue;

    if (result.length === 0) {
      result.push(curr);
      continue;
    }

    const prev = result[result.length - 1];

    // Same message ID replacement
    if (prev.id === curr.id) {
      result[result.length - 1] = {
        ...prev,
        ...curr,
        text: currTrim.length >= prev.text.length ? currTrim : prev.text,
        isFinal: prev.isFinal || curr.isFinal
      };
      continue;
    }

    // Check consecutive messages from the same speaker
    if (prev.speaker === curr.speaker && prev.speaker !== 'System') {
      const prevTrim = (prev.text || '').trim();
      const prevNorm = normalizeForComparison(prevTrim);
      const currNorm = normalizeForComparison(currTrim);

      // 1. Exact or normalized duplicate
      if (prevNorm === currNorm) {
        result[result.length - 1] = {
          ...curr,
          id: prev.id,
          text: currTrim.length >= prevTrim.length ? currTrim : prevTrim,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: prev.isFinal || curr.isFinal
        };
        continue;
      }

      // 2. curr contains prev (e.g. prev was partial utterance/first sentence, curr is full turn)
      if (prevNorm.length > 4 && (currNorm.includes(prevNorm) || currTrim.includes(prevTrim))) {
        result[result.length - 1] = {
          ...curr,
          id: prev.id,
          text: currTrim,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: prev.isFinal || curr.isFinal
        };
        continue;
      }

      // 3. prev contains curr (e.g. curr is an old prefix or late echo)
      if (currNorm.length > 4 && (prevNorm.includes(currNorm) || prevTrim.includes(currTrim))) {
        result[result.length - 1] = {
          ...prev,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: prev.isFinal || curr.isFinal
        };
        continue;
      }

      // 4. Heavy word overlap between consecutive utterances of the same speaker
      const overlapRatio = getWordOverlapRatio(prevTrim, currTrim);
      if (overlapRatio >= 0.75) {
        // More than 75% same vocabulary -> it's a re-transcription or echo, keep the longer one
        result[result.length - 1] = {
          ...curr,
          id: prev.id,
          text: currTrim.length >= prevTrim.length ? currTrim : prevTrim,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: prev.isFinal || curr.isFinal
        };
        continue;
      }

      // 5. Check if previous was unfinalized partial stream (append only distinct tail)
      if (!prev.isFinal && prev.speaker === 'AI Customer') {
        result[result.length - 1] = {
          ...prev,
          text: currTrim.length > prevTrim.length ? currTrim : prevTrim,
          timestamp: curr.timestamp || prev.timestamp,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: curr.isFinal
        };
        continue;
      }
    }

    // Also guard against recent duplicate AI customer messages within 12 seconds
    if (curr.speaker === 'AI Customer') {
      const recentDuplicate = result.slice(-4).find(m => 
        m.speaker === 'AI Customer' && 
        (normalizeForComparison(m.text) === normalizeForComparison(currTrim) || getWordOverlapRatio(m.text, currTrim) > 0.85)
      );
      if (recentDuplicate) {
        // Skip duplicate customer emission
        continue;
      }
    }

    result.push(curr);
  }

  return result;
}
