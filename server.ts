// AcuityVoice server: REST API for candidate history, WebSocket gateway for live calls, and the web app.
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { candidateStore } from './server/candidateStore';
import { handleCallSocket } from './server/callHandler';

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
