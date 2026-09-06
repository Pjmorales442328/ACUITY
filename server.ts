import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { AssemblyAIVoiceAgentSession } from './server/assemblyai_session';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-memory candidate storage
interface CandidateRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  targetRole: string;
  scenarioId: string;
  scenarioTitle: string;
  overallCefrLevel: string;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  empathyScore: number;
  keyStrengths: string[];
  developmentAreas: string[];
  hiringRecommendation: string;
  summaryVerdict: string;
  sessionDurationSeconds: number;
  turnCount: number;
  markersCount: number;
  createdAt: string;
}

let savedCandidates: CandidateRecord[] = [
  {
    id: 'sc_seed_101',
    candidateName: 'Maria Santos',
    candidateEmail: 'maria.santos@bpo-talent.com',
    targetRole: 'Tier-2 Financial Dispute Specialist',
    scenarioId: 'fintech_dispute',
    scenarioTitle: 'Fintech Card Dispute & Unauthorized Charge',
    overallCefrLevel: 'C1',
    fluencyScore: 88,
    lexicalScore: 85,
    grammarScore: 90,
    pronunciationScore: 92,
    empathyScore: 94,
    keyStrengths: [
      'Immediate de-escalation validation when customer expressed panic over rent deadline.',
      'Clear, precise explanation of provisional card credit and merchant blocking protocol.',
      'Flawless conversational flow without disruptive hesitation.'
    ],
    developmentAreas: [
      'Opportunity to offer SMS transaction fraud alerts at end of interaction.'
    ],
    hiringRecommendation: 'STRONG_HIRE',
    summaryVerdict: 'Candidate demonstrated exceptional composure, rapid empathetic problem-solving, and advanced C1 spoken English. Recommended for immediate deployment in Tier-2 Escalations.',
    sessionDurationSeconds: 142,
    turnCount: 5,
    markersCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'sc_seed_102',
    candidateName: 'David Kim',
    candidateEmail: 'david.kim@supportpro.io',
    targetRole: 'Telecom Enterprise Support Engineer',
    scenarioId: 'telecom_technical',
    scenarioTitle: 'Broadband Fiber Outage During Executive Meeting',
    overallCefrLevel: 'B2',
    fluencyScore: 78,
    lexicalScore: 82,
    grammarScore: 76,
    pronunciationScore: 84,
    empathyScore: 80,
    keyStrengths: [
      'Proactively activated 5G cellular fallback for the customer.',
      'Accurate domain vocabulary for optical fiber attenuation and telemetry.'
    ],
    developmentAreas: [
      'Minor grammar lapses with complex past tense constructions.',
      'Practice reassuring customer timeline before diving into router rebooting steps.'
    ],
    hiringRecommendation: 'HIRE',
    summaryVerdict: 'Strong technical aptitude and polite demeanor with solid B2 upper-intermediate communication skills. Approved for enterprise technical queue with standard onboarding.',
    sessionDurationSeconds: 165,
    turnCount: 4,
    markersCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
  },
  {
    id: 'sc_seed_103',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@talentpool.net',
    targetRole: 'E-Commerce VIP Customer Care',
    scenarioId: 'ecommerce_delivery',
    scenarioTitle: 'E-Commerce Lost Birthday Gift Order',
    overallCefrLevel: 'C2',
    fluencyScore: 95,
    lexicalScore: 92,
    grammarScore: 96,
    pronunciationScore: 94,
    empathyScore: 98,
    keyStrengths: [
      'World-class emotional alignment with parent anxious about daughter\'s birthday.',
      'Decisively waived expedited courier fees and initiated priority fulfillment.',
      'Elegant, native-level oral fluency with warm, confident intonation.'
    ],
    developmentAreas: [
      'Ensure standard wrap-up reference ID is recited clearly.'
    ],
    hiringRecommendation: 'STRONG_HIRE',
    summaryVerdict: 'Mastery of customer de-escalation and C2 bilingual mastery. Outstanding candidate for VIP accounts and team leadership pipeline.',
    sessionDurationSeconds: 118,
    turnCount: 4,
    markersCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// Lazy Gemini SDK initializer
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAssemblyAI = Boolean(process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here');
  res.json({
    status: 'healthy',
    gemini_configured: hasGemini,
    assemblyai_configured: hasAssemblyAI,
    max_session_seconds: 180,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/candidates', (req, res) => {
  res.json(savedCandidates);
});

app.post('/api/candidates', (req, res) => {
  const candidate = req.body;
  if (!candidate || !candidate.id) {
    return res.status(400).json({ error: 'Candidate scorecard payload required' });
  }
  savedCandidates = [candidate, ...savedCandidates.filter(c => c.id !== candidate.id)];
  res.json({ success: true, count: savedCandidates.length });
});

app.delete('/api/candidates/:id', (req, res) => {
  const { id } = req.params;
  savedCandidates = savedCandidates.filter(c => c.id !== id);
  res.json({ success: true, count: savedCandidates.length });
});

// AI Turn Evaluator (Uses Gemini if available, otherwise fast heuristics)
app.post('/api/ai/evaluate-turn', async (req, res) => {
  const { candidateQuote, customerStatement, scenarioTitle, currentScores, turnIndex } = req.body;
  
  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `You are the AcuityVoice real-time linguistic and CEFR evaluation engine.
Scenario: ${scenarioTitle || 'Customer Support Call'}
Customer said: "${customerStatement || ''}"
Candidate responded: "${candidateQuote || ''}"

Analyze the candidate's spoken response and return ONLY valid JSON matching this schema:
{
  "customerResponse": "Short 1-2 sentence response (under 25 words) from the customer in character, reactive to what the candidate just said.",
  "newTemperament": "AGITATED_ANXIOUS" | "DEFENSIVE" | "NEUTRAL_ATTENTIVE" | "REASSURED_CALMED" | "SATISFIED_GRATEFUL",
  "sentimentScore": <integer 0-100>,
  "temperamentReason": "Short phrase explaining why customer mood changed",
  "marker": {
    "markerType": "EMPATHY_DEMONSTRATED" | "ACTIVE_LISTENING" | "PROFESSIONAL_DE_ESCALATION" | "ADVANCED_VOCABULARY" | "GRAMMATICAL_ACCURACY" | "GRAMMAR_LAPSE" | "HESITATION_OR_FILLER" | "ROBOTIC_PHRASING",
    "impact": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
    "coachingNote": "1 short sentence diagnostic note on what the candidate did"
  },
  "deltaScores": {
    "fluency": <integer between -5 and +6>,
    "grammar": <integer between -5 and +6>,
    "lexical": <integer between -5 and +6>,
    "pronunciation": <integer between -3 and +5>,
    "empathy": <integer between -5 and +8>
  },
  "isResolutionReached": <boolean true if issue resolved or 4+ turns completed>
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (err) {
      console.warn('Gemini turn evaluation fallback due to error:', err);
    }
  }

  // Fallback intelligent heuristic evaluation
  const quote = (candidateQuote || '').toLowerCase();
  let markerType = 'ACTIVE_LISTENING';
  let impact = 'POSITIVE';
  let note = 'Addressed the customer inquiry directly.';
  let sentimentScore = Math.min(95, 35 + (turnIndex || 1) * 18);
  let newTemperament = 'NEUTRAL_ATTENTIVE';

  if (quote.includes('sorry') || quote.includes('understand') || quote.includes('apologize') || quote.includes('frustrat') || quote.includes('alarming')) {
    markerType = 'EMPATHY_DEMONSTRATED';
    impact = 'POSITIVE';
    note = 'Strong empathetic validation of customer situation.';
    sentimentScore += 10;
    newTemperament = 'REASSURED_CALMED';
  } else if (quote.includes('dispute') || quote.includes('provisional') || quote.includes('telemetry') || quote.includes('expedite') || quote.includes('dispatch') || quote.includes('authorize')) {
    markerType = 'ADVANCED_VOCABULARY';
    impact = 'POSITIVE';
    note = 'Applied precise technical or financial domain lexicon.';
  } else if (quote.includes('reference') || quote.includes('resolved') || quote.includes('welcome') || quote.includes('anything else')) {
    markerType = 'PROFESSIONAL_DE_ESCALATION';
    impact = 'POSITIVE';
    note = 'Polite closure and effective de-escalation.';
    sentimentScore = 94;
    newTemperament = 'SATISFIED_GRATEFUL';
  }

  if (sentimentScore >= 85) newTemperament = 'SATISFIED_GRATEFUL';
  else if (sentimentScore >= 65) newTemperament = 'REASSURED_CALMED';
  else if (sentimentScore >= 45) newTemperament = 'NEUTRAL_ATTENTIVE';
  else if (sentimentScore >= 30) newTemperament = 'DEFENSIVE';
  else newTemperament = 'AGITATED_ANXIOUS';

  res.json({
    customerResponse: (turnIndex && turnIndex >= 3)
      ? "Thank you so much! You solved this so quickly and I really appreciate your help."
      : "Okay, I appreciate that. Can you make sure this is completely taken care of?",
    newTemperament,
    sentimentScore: Math.min(100, Math.max(10, sentimentScore)),
    temperamentReason: "Customer reacted to candidate's explanation and support.",
    marker: {
      markerType,
      candidateQuote: candidateQuote || "I will handle this immediately.",
      impact,
      coachingNote: note
    },
    deltaScores: {
      fluency: 3,
      grammar: 2,
      lexical: 3,
      pronunciation: 2,
      empathy: 4
    },
    isResolutionReached: Boolean(turnIndex && turnIndex >= 3)
  });
});

// Gemini Neural TTS Synthesis Endpoint
app.post('/api/ai/synthesize-speech', async (req, res) => {
  const { text, voice } = req.body;
  const ai = getGemini();

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text prompt required for speech synthesis' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'Gemini not configured on server', fallbackToBrowser: true });
  }

  try {
    const selectedVoice = voice || 'Kore'; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      return res.json({
        success: true,
        audioBase64,
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
        voiceName: selectedVoice,
      });
    }

    return res.status(500).json({ error: 'No audio data returned from Gemini TTS', fallbackToBrowser: true });
  } catch (err: any) {
    console.warn('Gemini Neural TTS generation error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'TTS generation failed', fallbackToBrowser: true });
  }
});

// Real-Time Audio Transcription Endpoint (AssemblyAI + Gemini Multimodal STT)
app.post('/api/ai/transcribe', async (req, res) => {
  const { audioBase64, mimeType } = req.body;

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({ error: 'audioBase64 string is required' });
  }

  // 1. Check if AssemblyAI API Key is configured
  const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
  if (assemblyKey && assemblyKey !== 'your_assemblyai_api_key_here' && assemblyKey.trim().length > 10) {
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      const uploadResp = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          Authorization: assemblyKey,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      });

      if (uploadResp.ok) {
        const uploadJson: any = await uploadResp.json();
        const transcriptResp = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            Authorization: assemblyKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: uploadJson.upload_url,
            speech_model: 'universal-2',
          }),
        });

        if (transcriptResp.ok) {
          const transcriptJson: any = await transcriptResp.json();
          const transcriptId = transcriptJson.id;

          // Poll up to 6 seconds for completion
          let completed = false;
          let attempts = 0;
          let finalTranscript = '';

          while (!completed && attempts < 12) {
            await new Promise((r) => setTimeout(r, 500));
            attempts++;
            const pollResp = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
              headers: { Authorization: assemblyKey },
            });
            if (pollResp.ok) {
              const pollJson: any = await pollResp.json();
              if (pollJson.status === 'completed') {
                completed = true;
                finalTranscript = pollJson.text || '';
                return res.json({
                  success: true,
                  text: finalTranscript,
                  engine: 'AssemblyAI Universal-2',
                });
              } else if (pollJson.status === 'error') {
                break;
              }
            }
          }
        }
      }
    } catch (assemblyErr) {
      console.warn('AssemblyAI transcription fallback to Gemini:', assemblyErr);
    }
  }

  // 2. Gemini Multimodal Audio Transcription fallback
  const ai = getGemini();
  if (ai) {
    try {
      const cleanMime = (mimeType || 'audio/webm').split(';')[0];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioBase64,
            },
          },
          'Transcribe the exact English speech spoken in this microphone recording accurately. Output ONLY the raw transcribed text. Do not include markdown or explanations. If there is no speech or only background silence, return an empty string.',
        ],
      });

      const text = response.text ? response.text.trim() : '';
      return res.json({
        success: true,
        text,
        engine: 'Gemini Multimodal Speech-to-Text',
      });
    } catch (geminiErr: any) {
      console.warn('Gemini multimodal STT error:', geminiErr?.message || geminiErr);
      return res.status(500).json({ error: geminiErr?.message || 'Transcription failed' });
    }
  }

  return res.status(503).json({ error: 'No transcription engine available (Configure GEMINI_API_KEY or ASSEMBLYAI_API_KEY)' });
});

// WebSocket Server Initialization on same HTTP server
const wss = new WebSocketServer({ server, path: '/ws/interview' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] AcuityVoice client connected.');
  let activeSession: AssemblyAIVoiceAgentSession | null = null;

  ws.on('message', (message: any, isBinary: boolean) => {
    if (isBinary) {
      // Audio chunk received from candidate mic - forward directly to AssemblyAI session
      if (activeSession) {
        activeSession.handleClientBinaryAudio(Buffer.from(message));
      }
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      const type = data.type;

      if (type === 'start_interview') {
        const scenario = data.scenario || 'fintech_dispute';
        const voice = data.voice || 'anna';
        const assemblyKey = process.env.ASSEMBLYAI_API_KEY;

        console.log(`[WS] Starting interview for scenario: ${scenario}, voice: ${voice}`);
        if (assemblyKey && !data.mock_mode) {
          console.log('[WS] Launching native 2-way AssemblyAI Voice Agent session...');
          if (activeSession) {
            activeSession.stop();
          }
          activeSession = new AssemblyAIVoiceAgentSession(assemblyKey, scenario, ws, voice, 180);
          activeSession.start();
        } else {
          console.log('[WS] Running in simulation mode (No AssemblyAI key or mock_mode requested).');
          ws.send(JSON.stringify({
            type: 'session_connected',
            scenario,
            mode: 'MOCK_SIMULATION',
            max_duration_seconds: 180
          }));
        }
      } else if (type === 'audio_chunk') {
        if (activeSession && data.data) {
          activeSession.handleClientAudioChunk(data.data);
        }
      } else if (type === 'candidate_text') {
        if (activeSession && data.text) {
          activeSession.handleClientText(data.text);
        }
      } else if (type === 'stop_interview') {
        console.log('[WS] Candidate requested stop interview.');
        if (activeSession) {
          activeSession.stop();
          activeSession = null;
        }
      } else if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      // Ignore non-JSON
    }
  });

  ws.on('close', () => {
    console.log('[WS] AcuityVoice client disconnected.');
    if (activeSession) {
      activeSession.stop();
      activeSession = null;
    }
  });
});

// Vite Middleware & SPA Static Handling
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AcuityVoice] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startApp();
