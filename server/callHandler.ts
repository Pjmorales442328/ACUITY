// Handles one browser WebSocket: runs the live customer call, then the post-call assessment.
import crypto from 'crypto';
import WebSocket from 'ws';
import type { CandidateProfile, Scenario, Scorecard } from '../src/types';
import { assessCall } from './assessment';
import { candidateStore } from './candidateStore';
import { CustomerAgentSession } from './customerAgent';
import { parseProfile, parseScenario } from './validate';

// Hard cap per call to protect API credits.
const MAX_CALL_MS = 180_000;

export function handleCallSocket(client: WebSocket, apiKey: string | undefined) {
  let session: CustomerAgentSession | null = null;
  let scenario: Scenario | null = null;
  let profile: CandidateProfile | null = null;
  let limitTimer: NodeJS.Timeout | null = null;

  const send = (event: Record<string, unknown>) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(event));
  };
  const sendAudio = (pcm: Buffer) => {
    if (client.readyState === WebSocket.OPEN) client.send(pcm, { binary: true });
  };

  async function endCall() {
    if (!session || !scenario || !profile || !apiKey) return;
    if (limitTimer) clearTimeout(limitTimer);
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
      session?.onMicAudio(data as Buffer);
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
      session = new CustomerAgentSession(apiKey, scenario, send, sendAudio);
      session.start();
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
    session?.stop();
    session = null;
  });
}
