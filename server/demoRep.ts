// Demo mode: a second Voice Agent plays the rep (a strong candidate or a new hire), so two AssemblyAI agents hold the call with no microphone.
import WebSocket from 'ws';
import type { CandidateProfile, DemoRepStyle, Scenario } from '../src/types';
import type { CustomerAgentSession } from './customerAgent';

const VOICE_AGENT_URL = 'wss://agents.assemblyai.com/v1/ws';
const BYTES_PER_MS = 48; // 24 kHz PCM16 mono
const TICK_MS = 40;

// Half-duplex turn-taking: one voice on the line at a time. A speaker keeps the floor until its whole reply has played.
class Floor {
  holder: RealtimeFeed | null = null;
}

// Streams queued PCM to a sink in real time, padding with silence, so each agent hears the other as a live caller.
// Queued speech is held back while the other side has the floor, so the agents never talk over each other.
class RealtimeFeed {
  private queue: Buffer[] = [];
  private sentBytes = 0;
  private startedAt = Date.now();
  private replying = false;
  private timer = setInterval(() => this.tick(), TICK_MS);

  constructor(
    private floor: Floor,
    private sink: (pcm: Buffer) => void,
    private onVoice: (pcm: Buffer) => void // only the speech actually put on the line, for the browser
  ) {}

  push(pcm: Buffer) {
    this.queue.push(pcm);
  }

  replyStarted() {
    this.replying = true;
  }

  replyDone() {
    this.replying = false;
  }

  // The speaker was interrupted: drop what it hasn't said yet and give up the floor.
  flush() {
    this.queue = [];
    this.replying = false;
    if (this.floor.holder === this) this.floor.holder = null;
  }

  stop() {
    clearInterval(this.timer);
  }

  private tick() {
    const due = Math.floor(((Date.now() - this.startedAt) * BYTES_PER_MS) / 2) * 2 - this.sentBytes;
    if (due <= 0) return;
    const out = Buffer.alloc(due);
    let filled = 0;
    if (this.queue.length && !this.floor.holder) this.floor.holder = this;
    while (this.floor.holder === this && filled < due && this.queue.length) {
      const head = this.queue[0];
      const n = Math.min(head.length, due - filled);
      head.copy(out, filled, 0, n);
      filled += n;
      if (n === head.length) this.queue.shift();
      else this.queue[0] = head.subarray(n);
    }
    this.sentBytes += due;
    this.sink(out);
    if (filled) this.onVoice(out.subarray(0, filled));
    if (this.floor.holder === this && !this.replying && !this.queue.length) this.floor.holder = null;
  }
}

const TRAINEE = `You are warm and you genuinely want to help, but you are still learning:
- You start some sentences with "um" or "so, uh".
- You tend to promise a fix without giving an exact time or reference number, unless the caller pushes.
- You apologize sincerely and you do take ownership once the caller is upset.
Make up plausible details (reference numbers, timelines) when the caller asks. When the problem is handled, close the call politely.`;

const STRONG = `You are an experienced, calm, confident agent, the kind every team wants to hire:
- Follow the call script below exactly, one step at a time, in order. Never skip a step, even when the caller pushes or is angry.
- When a step quotes words, say those exact words.
- If the caller resists verification, explain in one sentence that it protects their account from fraud, then ask again.
- Name the caller's specific worry and say what you will do about it. Acknowledge feelings once, then act.
- Give exact timeframes, fees and reference numbers. State the policies below word for word when they come up, and never promise anything they forbid.
- If the caller demands something the policy forbids, say no kindly, explain why in one sentence, and offer what you can do.
- Keep the call moving: once a step is done, go straight to the next. Don't re-ask for details the caller already gave.
- No filler words. Finish with a short recap, the reference number and the closing question from the script.`;

function buildRepPrompt(s: Scenario, style: DemoRepStyle, repName: string): string {
  const strong = style === 'strong';
  const script = s.script.length
    ? `\nYOUR COMPANY'S CALL SCRIPT. ${strong ? 'Follow every step, in order' : 'Follow it in order, in your own words, but as a new hire you forget one of the steps'}:\n${s.script.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n`
    : '';
  const policies = strong && s.policies?.length ? `\nPOLICIES:\n${s.policies.map(p => `- ${p}`).join('\n')}\n` : '';
  return `BE SHORT. ${strong ? 'One to three spoken sentences per reply, under 45 words, and one script step at a time' : 'One or two spoken sentences per reply, under 30 words'}. Say it in one go, then stop and listen.

You are ${repName}, a customer support agent${strong ? '' : ' in your first week on the phones'}. The caller is ${s.customerName}. Call topic: ${s.title}. ${s.description}
Where the script says [first name], say ${repName}.

${strong ? STRONG : TRAINEE}
${script}${policies}
Never mention being an AI, a demo, or a test. Plain spoken sentences only, no lists or symbols.`;
}

export class DemoRep {
  private aai: WebSocket;
  private toCustomer: RealtimeFeed; // rep voice -> customer agent input (the "mic")
  private toRep: RealtimeFeed; // customer voice -> rep agent input

  constructor(
    apiKey: string,
    scenario: Scenario,
    profile: CandidateProfile,
    style: DemoRepStyle,
    customer: CustomerAgentSession,
    send: (e: Record<string, unknown>) => void,
    sendCustomerAudio: (pcm: Buffer) => void
  ) {
    const floor = new Floor();
    this.toCustomer = new RealtimeFeed(floor, pcm => customer.onMicAudio(pcm), pcm => send({ type: 'rep_audio', data: pcm.toString('base64') }));
    this.aai = new WebSocket(VOICE_AGENT_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
    this.toRep = new RealtimeFeed(floor, pcm => {
      if (this.aai.readyState === WebSocket.OPEN) this.aai.send(JSON.stringify({ type: 'input.audio', audio: pcm.toString('base64') }));
    }, sendCustomerAudio);

    this.aai.on('open', () => this.aai.send(JSON.stringify({
      type: 'session.update',
      session: {
        system_prompt: buildRepPrompt(scenario, style, profile.candidateName.split(' ')[0] || 'Sam'),
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
        this.toCustomer.push(Buffer.from(m.data, 'base64'));
      } else if (m.type === 'reply.started') {
        this.toCustomer.replyStarted();
      } else if (m.type === 'reply.done') {
        this.toCustomer.replyDone();
      } else if (m.type === 'input.speech.started') {
        // The rep heard the customer keep talking: drop the rep reply that hasn't been played yet.
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

  customerReplyStarted() {
    this.toRep.replyStarted();
  }

  customerReplyDone() {
    this.toRep.replyDone();
  }

  // The customer heard the rep keep talking: drop the customer reply that hasn't been played yet.
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
