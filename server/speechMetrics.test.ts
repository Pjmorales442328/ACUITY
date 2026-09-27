// Self-check for speech metrics and script adherence; run with `npm test`.
import assert from 'node:assert/strict';
import { computeSpeechMetrics, locateQuote, segmentWords, type Word } from './speechMetrics';
import { scriptAdherence } from './assessment';
import { evaluateBar } from './criteria';

const w = (text: string, start: number, end: number, confidence = 0.99): Word => ({ text, start, end, confidence });

// Real Universal-3.5 Pro output for "Um, so, uh, you need to wait, like, 7 days. That is the policy."
const words: Word[] = [
  w('Um,', 177, 500), w('so,', 840, 1000), w('uh,', 1633, 1900), w('you', 2215, 2300),
  w('need', 2312, 2500), w('to', 2538, 2600), w('wait,', 2700, 3000), w('like,', 3492, 3700),
  w('7', 4171, 4400), w('days.', 4559, 4900),
  // customer speaks for ~6s, then the candidate answers again
  w('That', 11000, 11200), w('is', 11210, 11300), w('the', 11310, 11400), w('policy.', 11410, 11900, 0.4)
];

const segments = segmentWords(words);
assert.equal(segments.length, 2, 'splits on long gaps');
assert.equal(segments[1].text, 'That is the policy.');

const m = computeSpeechMetrics(words);
assert.equal(m.wordCount, 14);
assert.equal(m.fillerCount, 3, 'um, uh, like,');
assert.equal(m.hesitationPauses, 0, 'no 800ms+ pause inside a segment');
assert.deepEqual(m.unclearWords, ['policy']);
assert.equal(m.speakingSeconds, 5.6);
assert.ok(m.wordsPerMinute > 140 && m.wordsPerMinute < 160, `wpm ${m.wordsPerMinute}`);

const withPause = computeSpeechMetrics([w('I', 0, 100), w('think', 1200, 1500)]);
assert.equal(withPause.hesitationPauses, 1);

assert.equal(computeSpeechMetrics([]).wordsPerMinute, 0);

assert.equal(segmentWords(words, [2250]).length, 3, 'customer turn at 2.25s splits the first answer');
assert.equal(locateQuote(words, 'you need to wait, like, 7 days.'), 2215, 'punctuation-insensitive match');
assert.equal(locateQuote(words, 'That is the policy'), 11000);
assert.equal(locateQuote(words, 'That was the policy'), null, 'paraphrase rejected');
assert.equal(locateQuote(words, 'you need to wait, like, seven days.'), 2215, 'number words match digits');
assert.equal(locateQuote(words, 'That is the policy. You need to wait, like, 7 days.'), 2215, 'stitched sentences each found');
assert.equal(locateQuote(words, 'That is the policy. You must wait.'), null, 'one paraphrased sentence rejects the stitch');
// Script adherence: partial steps count half.
const step = (status: 'DONE' | 'PARTIAL' | 'MISSED') => ({ step: 's', status, quote: null, atMs: null });
assert.equal(scriptAdherence([]), null);
assert.equal(scriptAdherence([step('DONE'), step('PARTIAL'), step('MISSED'), step('MISSED')]), 38);

// Bars: level 1 has none; a missed critical step fails even a strong call.
const crit = (status: 'DONE' | 'MISSED') => ({ step: 'Verify identity', status, quote: null, atMs: null, critical: true });
assert.equal(evaluateBar(1, 'READY', [], 100), null);
assert.equal(evaluateBar(2, 'READY_WITH_COACHING', [crit('DONE')], 75)?.passed, true);
assert.equal(evaluateBar(2, 'READY', [crit('MISSED')], 100)?.passed, false);
assert.equal(evaluateBar(3, 'READY_WITH_COACHING', [crit('DONE')], 95)?.reasons.length, 1, 'certification needs READY');
assert.equal(evaluateBar(3, 'READY', [crit('DONE')], 85)?.passed, false, 'certification needs 90%');
console.log('speechMetrics + criteria: all checks passed');
