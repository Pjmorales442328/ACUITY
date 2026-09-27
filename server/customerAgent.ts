// Relays a browser call to an AssemblyAI Voice Agent playing the customer, and records the candidate's mic audio.
import WebSocket from 'ws';
import type { Scenario } from '../src/types';
import { buildCustomerPrompt } from './customerPrompt';

const VOICE_AGENT_URL = 'wss://agents.assemblyai.com/v1/ws';

export interface CustomerTurn {
  text: string;
  atMs: number;
  interrupted: boolean;
}

export interface CallRecording {
  micAudio: Buffer;
  customerTurns: CustomerTurn[];
  durationMs: number;
}

type ClientEvent = Record<string, unknown> & { type: string };

export class CustomerAgentSession {
  private aai: WebSocket | null = null;
  private micChunks: Buffer[] = [];
  private micStartedAt = 0;
  private replyStartedAt = new Map<string, number>();
  private customerTurns: CustomerTurn[] = [];

  constructor(
    private apiKey: string,
    private scenario: Scenario,
    private send: (event: ClientEvent) => void,
    private sendAudio: (pcm: Buffer) => void
  ) {}

  start() {
    const aai = new WebSocket(VOICE_AGENT_URL, { headers: { Authorization: `Bearer ${this.apiKey}` } });
    this.aai = aai;

    aai.on('open', () => {
      aai.send(JSON.stringify({
        type: 'session.update',
        session: {
          system_prompt: buildCustomerPrompt(this.scenario),
          greeting: this.scenario.greeting,
          input: {
            format: { encoding: 'audio/pcm' },
            transcription_mode: 'max_accuracy',
            ...(this.scenario.keyterms.length ? { keyterms: this.scenario.keyterms } : {})
          },
          output: { voice: this.scenario.voice, format: { encoding: 'audio/pcm' } }
        }
      }));
    });

    aai.on('message', raw => {
      try {
        this.onAgentEvent(JSON.parse(raw.toString()));
      } catch (err) {
        console.warn('[customerAgent] bad event', err);
      }
    });
    aai.on('error', err => this.send({ type: 'error', message: `Voice Agent connection error: ${err.message}` }));
    aai.on('close', (code, reason) => {
      if (code !== 1000) this.send({ type: 'agent_closed', code, reason: reason.toString() });
    });
  }

  private callMs() {
    return this.micStartedAt ? Date.now() - this.micStartedAt : 0;
  }

  private onAgentEvent(m: any) {
    switch (m.type) {
      case 'session.ready':
        return this.send({ type: 'ready' });
      case 'reply.started':
        this.replyStartedAt.set(m.reply_id, this.callMs());
        return this.send({ type: 'agent_reply_started', replyId: m.reply_id });
      case 'reply.audio':
        return this.sendAudio(Buffer.from(m.data, 'base64'));
      case 'transcript.agent.delta':
        return this.send({ type: 'agent_delta', replyId: m.reply_id, delta: m.delta });
      case 'transcript.agent':
        if (m.text) this.customerTurns.push({ text: m.text, atMs: this.replyStartedAt.get(m.reply_id) ?? this.callMs(), interrupted: !!m.interrupted });
        return this.send({ type: 'agent_final', replyId: m.reply_id, text: m.text, interrupted: !!m.interrupted });
      case 'reply.done':
        return this.send({ type: 'agent_reply_done', replyId: m.reply_id, status: m.status });
      case 'input.speech.started':
        return this.send({ type: 'user_speech_started' });
      case 'input.speech.stopped':
        return this.send({ type: 'user_speech_stopped' });
      case 'transcript.user.delta':
        return this.send({ type: 'user_delta', text: m.text });
      case 'transcript.user':
        return this.send({ type: 'user_final', itemId: m.item_id, text: m.text, atMs: this.callMs() });
      case 'session.error':
      case 'error':
        console.warn('[customerAgent] error event', m);
        return this.send({ type: 'error', message: m.message || 'Voice Agent error' });
    }
  }

  onMicAudio(pcm: Buffer) {
    if (!this.micStartedAt) this.micStartedAt = Date.now();
    this.micChunks.push(pcm);
    if (this.aai?.readyState === WebSocket.OPEN) {
      this.aai.send(JSON.stringify({ type: 'input.audio', audio: pcm.toString('base64') }));
    }
  }

  stop(): CallRecording {
    if (this.aai) {
      try {
        if (this.aai.readyState === WebSocket.OPEN) this.aai.send(JSON.stringify({ type: 'session.end' }));
        this.aai.close(1000);
      } catch (err) {
        console.warn('[customerAgent] close failed', err);
      }
      this.aai = null;
    }
    return {
      micAudio: Buffer.concat(this.micChunks),
      customerTurns: this.customerTurns,
      durationMs: this.callMs()
    };
  }
}
