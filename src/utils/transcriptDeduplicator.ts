import { TranscriptMessage } from '../types';

/**
 * Normalizes text for linguistic comparison (strips punctuation, extra spaces, casing)
 */
function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
      if (prevNorm.length > 4 && currNorm.includes(prevNorm)) {
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
      if (currNorm.length > 4 && prevNorm.includes(currNorm)) {
        result[result.length - 1] = {
          ...prev,
          markers: [...(prev.markers || []), ...(curr.markers || [])],
          isFinal: prev.isFinal || curr.isFinal
        };
        continue;
      }

      // 4. For AI Customer turns: if emitted within 6 seconds of each other or while previous turn was unfinalized,
      // merge consecutive sentences into one conversational turn bubble
      if (prev.speaker === 'AI Customer') {
        const timeDiff = Math.abs((curr.timestamp || Date.now()) - (prev.timestamp || Date.now()));
        if (!prev.isFinal || timeDiff < 6000) {
          result[result.length - 1] = {
            ...prev,
            text: `${prevTrim} ${currTrim}`,
            timestamp: curr.timestamp || prev.timestamp,
            markers: [...(prev.markers || []), ...(curr.markers || [])],
            isFinal: curr.isFinal
          };
          continue;
        }
      }
    }

    result.push(curr);
  }

  return result;
}
