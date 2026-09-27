// WebSocket client for the /ws/call gateway: sends mic audio and control messages, receives agent audio and events.
import type { CandidateProfile, Scenario } from '../types';

export type ServerEvent = { type: string; [key: string]: any };

export interface CallSocket {
  start: (scenario: Scenario, profile: CandidateProfile, demo: boolean) => void;
  sendAudio: (pcm: ArrayBuffer) => void;
  end: () => void;
  close: () => void;
}

export function openCallSocket(handlers: {
  onOpen: () => void;
  onEvent: (e: ServerEvent) => void;
  onAudio: (pcm: ArrayBuffer) => void;
  onClose: () => void;
}): CallSocket {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws/call`);
  ws.binaryType = 'arraybuffer';
  ws.onopen = handlers.onOpen;
  ws.onclose = handlers.onClose;
  ws.onerror = () => handlers.onEvent({ type: 'error', message: 'Connection to the AcuityVoice server failed' });
  ws.onmessage = ({ data }) => {
    if (data instanceof ArrayBuffer) return handlers.onAudio(data);
    try {
      handlers.onEvent(JSON.parse(data));
    } catch {
      console.warn('Unparseable server event', data);
    }
  };

  const sendJson = (msg: object) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg));
  return {
    start: (scenario, profile, demo) => sendJson({ type: 'start', scenario, profile, demo }),
    sendAudio: pcm => ws.readyState === WebSocket.OPEN && ws.send(pcm),
    end: () => sendJson({ type: 'end' }),
    close: () => ws.close()
  };
}
