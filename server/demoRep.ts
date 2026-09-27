// Demo mode: a second Voice Agent plays a trainee rep, so two AssemblyAI agents hold the call with no microphone.
import WebSocket from 'ws';
import type { Scenario } from '../src/types';
import type { CustomerAgentSession } from './customerAgent';

const VOICE_AGENT_URL = 'wss://agents.assemblyai.com/v1/ws';
const BYTES_PER_MS = 48; // 24 kHz PCM16 mono
const TICK_MS = 40;

// Streams queued PCM to a sink in real time, padding with silence, so each agent hears the other as a live caller.
class RealtimeFeed {
  private queue: Buffer[] = [];
  private sentBytes = 0;
  private startedAt = Date.now();
  private timer = setInterval(() => this.tick(), TICK_MS);

  constructor(private sink: (pcm: Buffer) => void) {}

  push(pcm: Buffer) {
    this.queue.push(pcm);
  }

  flush() {
    this.queue = [];
  }

  stop() {
    clearInterval(this.timer);
  }

  private tick() {
    const due = Math.floor(((Date.now() - this.startedAt) * BYTES_PER_MS) / 2) * 2 - this.sentBytes;
    if (due <= 0) return;
    const out = Buffer.alloc(due);
    let filled = 0;
    while (filled < due && this.queue.length) {
      const head = this.queue[0];
      const n = Math.min(head.length, due - filled);
      head.copy(out, filled, 0, n);
      filled += n;
      if (n === head.length) this.queue.shift();
      else this.queue[0] = head.subarray(n);
    }
    this.sentBytes += due;
    this.sink(out);
  }
}

function buildRepPrompt(s: Scenario): string {
  return `BE SHORT. One or two spoken sentences per reply, under 30 words. Say it in one go, then stop and listen.

You are Sam, a customer support agent in your first week on the phones. The caller is ${s.customerName}. Call topic: ${s.title}. ${s.description}

You are warm and you genuinely want to help, but you are still learning:
- You start some sentences with "um" or "so, uh".
- You tend to promise a fix without giving an exact time or reference number, unless the caller pushes.
- You apologize sincerely and you do take ownership once the caller is upset.
Make up plausible details (reference numbers, timelines) when the caller asks. When the problem is handled, close the call politely.

Never mention being an AI, a demo, or a test. Plain spoken sentences only, no lists or symbols.`;
}

export class DemoRep {
  private aai: WebSocket;
  private toCustomer: RealtimeFeed; // rep voice -> customer agent input (the "mic")
  private toRep: RealtimeFeed; // customer voice -> rep agent input

  constructor(apiKey: string, scenario: Scenario, customer: CustomerAgentSession, send: (e: Record<string, unknown>) => void) {
    this.toCustomer = new RealtimeFeed(pcm => customer.onMicAudio(pcm));
    this.aai = new WebSocket(VOICE_AGENT_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
    this.toRep = new RealtimeFeed(pcm => {
      if (this.aai.readyState === WebSocket.OPEN) this.aai.send(JSON.stringify({ type: 'input.audio', audio: pcm.toString('base64') }));
    });

    this.aai.on('open', () => this.aai.send(JSON.stringify({
      type: 'session.update',
      session: {
        system_prompt: buildRepPrompt(scenario),
        input: { format: { encoding: 'audio/pcm' } },
        output: { voice: scenario.voice === 'charles' ? 'paul' : 'charles', format: { encoding: 'audio/pcm' } }
      }
    })));
    this.aai.on('message', raw => {
      let m: any;
      try {
        m = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (m.type === 'reply.audio') {
        const pcm = Buffer.from(m.data, 'base64');
        this.toCustomer.push(pcm);
        send({ type: 'rep_audio', data: m.data });
      } else if (m.type === 'input.speech.started') {
        // The customer cut in: drop rep audio that hasn't "reached" the customer yet.
        this.toCustomer.flush();
        send({ type: 'rep_interrupted' });
      } else if (m.type === 'error' || m.type === 'session.error') {
        console.warn('[demoRep] error event', m);
        send({ type: 'error', message: `Demo rep: ${m.message || 'Voice Agent error'}` });
      }
    });
    this.aai.on('error', err => send({ type: 'error', message: `Demo rep connection error: ${err.message}` }));
  }

  // Customer agent audio, as it would reach the rep's ear.
  hearCustomer(pcm: Buffer) {
    this.toRep.push(pcm);
  }

  // The rep started talking over the customer: stop feeding the customer's queued words to the rep.
  customerInterrupted() {
    this.toRep.flush();
  }

  stop() {
    this.toCustomer.stop();
    this.toRep.stop();
    try {
      if (this.aai.readyState === WebSocket.OPEN) this.aai.send(JSON.stringify({ type: 'session.end' }));
      this.aai.close(1000);
    } catch (err) {
      console.warn('[demoRep] close failed', err);
    }
  }
}
