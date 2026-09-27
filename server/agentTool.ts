// Runs a silent AssemblyAI Voice Agent session whose only job is to call one JSON-Schema tool; resolves with its arguments.
import WebSocket from 'ws';

const VOICE_AGENT_URL = 'wss://agents.assemblyai.com/v1/ws';

export function callAgentTool<T>(apiKey: string, systemPrompt: string, tool: { name: string } & Record<string, unknown>, timeoutMs = 45_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(VOICE_AGENT_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
    const finish = (fn: () => void) => {
      clearTimeout(timer);
      try {
        ws.close(1000);
      } catch {}
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error(`${tool.name} timed out`))), timeoutMs);

    ws.on('open', () => ws.send(JSON.stringify({
      type: 'session.update',
      session: { system_prompt: systemPrompt, tools: [{ type: 'function', execution_mode: 'hold', ...tool }] }
    })));
    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'session.ready') {
        ws.send(JSON.stringify({ type: 'reply.create', instructions: `Call ${tool.name} now with your complete answer. Do not speak.` }));
      } else if (m.type === 'tool.call' && m.name === tool.name) {
        finish(() => resolve(m.arguments as T));
      } else if (m.type === 'session.error' || m.type === 'error') {
        finish(() => reject(new Error(`${tool.name} failed: ${m.message}`)));
      }
    });
    ws.on('error', err => finish(() => reject(err)));
  });
}
