// Handles one browser WebSocket: runs the live customer call, then the post-call assessment.
import crypto from 'crypto';
import WebSocket from 'ws';
import type { CandidateProfile, Scenario, Scorecard } from '../src/types';
import { assessCall } from './assessment';
import { candidateStore } from './store';
import { CustomerAgentSession } from './customerAgent';
import { DemoRep } from './demoRep';
import { parseProfile, parseScenario } from './validate';

// Hard cap per call to protect API credits.
const MAX_CALL_MS = 300_000; // troubleshooting call flows need 4+ minutes; 3 cut the close
// Caps simultaneous calls so a public URL can't drain the free-tier key.
const MAX_LIVE_CALLS = Number(process.env.MAX_LIVE_CALLS) || 3;
let liveCalls = 0;

export function handleCallSocket(client: WebSocket, apiKey: string | undefined) {
  let session: CustomerAgentSession | null = null;
  let demoRep: DemoRep | null = null;
  let scenario: Scenario | null = null;
  let profile: CandidateProfile | null = null;
  let limitTimer: NodeJS.Timeout | null = null;
  let holdsSlot = false;
  const releaseSlot = () => {
    if (holdsSlot) liveCalls--;
    holdsSlot = false;
  };

  const send = (event: Record<string, unknown>) => {
    if (event.type === 'user_speech_started') demoRep?.customerInterrupted();
    if (event.type === 'agent_reply_started') demoRep?.customerReplyStarted();
    if (event.type === 'agent_reply_done') demoRep?.customerReplyDone();
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(event));
  };
  const sendToBrowser = (pcm: Buffer) => {
    if (client.readyState === WebSocket.OPEN) client.send(pcm, { binary: true });
  };
  // In demo mode the customer's voice goes through the turn-taking feed first, so the browser hears what the rep hears.
  const sendAudio = (pcm: Buffer) => (demoRep ? demoRep.hearCustomer(pcm) : sendToBrowser(pcm));
  const stopDemoRep = () => {
    demoRep?.stop();
    demoRep = null;
  };

  async function endCall() {
    if (!session || !scenario || !profile || !apiKey) return;
    if (limitTimer) clearTimeout(limitTimer);
    stopDemoRep();
    releaseSlot();
    const recording = session.stop();
    session = null;
    send({ type: 'analysis_started' });
    try {
      const assessment = await assessCall(apiKey, scenario, recording);
      const scorecard: Scorecard = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...profile, ...assessment };
      candidateStore.add(scorecard);
      send({ type: 'assessment', scorecard });
    } catch (err: any) {
      console.error('[callHandler] assessment failed', err);
      send({ type: 'assessment_error', message: err?.message || 'Assessment failed' });
    }
  }

  client.on('message', (data, isBinary) => {
    if (isBinary) {
      if (!demoRep) session?.onMicAudio(data as Buffer);
      return;
    }
    let msg: any;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return send({ type: 'error', message: 'Malformed message' });
    }

    if (msg.type === 'start') {
      if (!apiKey) return send({ type: 'error', message: 'ASSEMBLYAI_API_KEY is not configured on the server' });
      if (session) return;
      scenario = parseScenario(msg.scenario);
      profile = parseProfile(msg.profile);
      if (!scenario) return send({ type: 'error', message: 'Scenario is missing required fields' });
      if (liveCalls >= MAX_LIVE_CALLS) return send({ type: 'error', message: 'All practice lines are busy. Try again in a couple of minutes.' });
      liveCalls++;
      holdsSlot = true;
      session = new CustomerAgentSession(apiKey, scenario, send, sendAudio);
      session.start();
      if (msg.demo) demoRep = new DemoRep(apiKey, scenario, profile, msg.demo === 'strong' ? 'strong' : 'trainee', session, send, sendToBrowser);
      limitTimer = setTimeout(() => {
        send({ type: 'time_limit' });
        endCall();
      }, MAX_CALL_MS);
    } else if (msg.type === 'end') {
      endCall();
    }
  });

  client.on('close', () => {
    if (limitTimer) clearTimeout(limitTimer);
    releaseSlot();
    stopDemoRep();
    session?.stop();
    session = null;
  });
}
