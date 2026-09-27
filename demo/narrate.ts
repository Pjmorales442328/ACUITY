// Generates the demo-video voiceover with the AssemblyAI Voice Agent API: each line is spoken as the session greeting.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const VOICE = process.env.NARRATOR_VOICE || 'paul';
const OUT = path.join(import.meta.dirname, 'out', 'narration');
const lines: { id: string; text: string }[] = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'narration.json'), 'utf8'));

function wav(pcm: Buffer) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function speak(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://agents.assemblyai.com/v1/ws', { headers: { Authorization: `Bearer ${process.env.ASSEMBLYAI_API_KEY}` } });
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 90_000);
    ws.on('open', () => ws.send(JSON.stringify({
      type: 'session.update',
      session: { system_prompt: 'You are a narrator. Say nothing beyond your greeting.', greeting: text, input: { format: { encoding: 'audio/pcm' } }, output: { voice: VOICE, format: { encoding: 'audio/pcm' } } }
    })));
    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'reply.audio') chunks.push(Buffer.from(m.data, 'base64'));
      else if (m.type === 'reply.done') { clearTimeout(timer); ws.close(1000); resolve(Buffer.concat(chunks)); }
      else if (m.type === 'error' || m.type === 'session.error') { clearTimeout(timer); ws.close(); reject(new Error(m.message)); }
    });
    ws.on('error', reject);
  });
}

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const { id, text } of lines) {
  if (only.length && !only.includes(id)) continue;
  const pcm = await speak(text);
  fs.writeFileSync(path.join(OUT, `${id}.wav`), wav(pcm));
  console.log(id, (pcm.length / 48000).toFixed(1) + 's');
}
