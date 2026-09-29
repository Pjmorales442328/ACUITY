// Post-call transcription of the candidate's recorded mic audio with AssemblyAI Universal-3.5 Pro.
import type { Word } from './speechMetrics';

const API = 'https://api.assemblyai.com/v2';
const SAMPLE_RATE = 24000;
const POLL_MS = 1500;
const TIMEOUT_MS = 240_000; // 5-minute calls plus a slow queue can exceed 2 minutes

function wavFromPcm16(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function aai<T>(apiKey: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: apiKey, ...(init.headers || {}) }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`AssemblyAI ${path} failed (${res.status}): ${body.error || JSON.stringify(body)}`);
  return body as T;
}

export async function transcribeCandidate(apiKey: string, pcm24k: Buffer, keyterms: string[]): Promise<Word[]> {
  const { upload_url } = await aai<{ upload_url: string }>(apiKey, '/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    body: new Uint8Array(wavFromPcm16(pcm24k))
  });

  const { id } = await aai<{ id: string }>(apiKey, '/transcript', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url: upload_url,
      speech_models: ['universal-3-5-pro', 'universal-2'],
      disfluencies: true,
      ...(keyterms.length ? { keyterms_prompt: keyterms } : {})
    })
  });

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const t = await aai<{ status: string; error?: string; words?: Word[] }>(apiKey, `/transcript/${id}`);
    if (t.status === 'completed') return t.words || [];
    if (t.status === 'error') throw new Error(`Transcription failed: ${t.error}`);
    await new Promise(r => setTimeout(r, POLL_MS));
  }
  throw new Error('Transcription timed out');
}
