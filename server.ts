// AcuityVoice server: REST API for candidate history, WebSocket gateway for live calls, and the web app.
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { candidateStore, scenarioStore } from './server/store';
import { parseScenario } from './server/validate';
import { handleCallSocket } from './server/callHandler';
import { analyzeScript } from './server/scriptAnalyzer';
import { extractScriptText } from './server/scriptText';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim() || undefined;

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', assemblyai_configured: Boolean(apiKey) });
});
app.get('/api/candidates', (_req, res) => {
  res.json(candidateStore.list());
});
app.delete('/api/candidates/:id', (req, res) => {
  candidateStore.remove(req.params.id);
  res.json({ ok: true });
});
// Custom scenarios authored in Scenario Studio (built-in ones ship with the client).
app.get('/api/scenarios', (_req, res) => {
  res.json(scenarioStore.list());
});
app.post('/api/scenarios', (req, res) => {
  const scenario = parseScenario(req.body);
  if (!scenario || !scenario.id.startsWith('custom_')) return res.status(400).json({ error: 'Invalid scenario' });
  scenarioStore.add(scenario);
  res.json(scenario);
});
app.delete('/api/scenarios/:id', (req, res) => {
  scenarioStore.remove(req.params.id);
  res.json({ ok: true });
});

// Upload a call script file; returns a playbook with three practice levels for review (nothing is saved yet).
app.post('/api/scripts/analyze', express.raw({ type: '*/*', limit: '5mb' }), async (req, res) => {
  if (!apiKey) return res.status(503).json({ error: 'ASSEMBLYAI_API_KEY is not configured on the server' });
  try {
    const text = await extractScriptText(req.body, decodeURIComponent(String(req.headers['x-file-name'] || '')));
    res.json(await analyzeScript(apiKey, text));
  } catch (err: any) {
    console.error('[scripts] analyze failed', err);
    res.status(400).json({ error: err?.message || 'Could not analyze that script' });
  }
});

const wss = new WebSocketServer({ server, path: '/ws/call' });
wss.on('connection', ws => handleCallSocket(ws, apiKey));

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AcuityVoice] http://localhost:${PORT} (AssemblyAI key ${apiKey ? 'loaded' : 'MISSING'})`);
  });
}

start();
