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
  transcript?: any[];
  initialSentimentScore?: number;
  finalSentimentScore?: number;
  initialTemperament?: string;
  finalTemperament?: string;
  deEscalationOutcome?: string;
  deEscalationNotes?: string;
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
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    initialSentimentScore: 28,
    finalSentimentScore: 94,
    initialTemperament: 'AGITATED_ANXIOUS',
    finalTemperament: 'SATISFIED_GRATEFUL',
    deEscalationOutcome: 'RESOLVED_AND_CALMED',
    deEscalationNotes: 'Customer opened with severe panic over an unauthorized charge ahead of rent. Candidate validated distress immediately, blocked recurring billing, and issued instant provisional credit (+66% sentiment swing).',
    transcript: [
      {
        id: 'msg_s1_1',
        speaker: 'AI Customer',
        text: "I was looking at my mobile banking app twenty minutes ago and saw a pending $45.00 charge from 'CloudStream Pro'. I didn't authorize this! My rent check is scheduled to clear tomorrow morning and this is going to overdraw my checking account. I need this refunded immediately!",
        timestamp: Date.now() - 3600000 * 5 + 2000,
        isFinal: true
      },
      {
        id: 'msg_s1_2',
        speaker: 'Candidate',
        text: "I completely understand how stressful unexpected charges are, especially right before an important rent payment. Let's get this resolved right now. I have your account in front of me and I can issue an immediate provisional credit while we investigate the merchant.",
        timestamp: Date.now() - 3600000 * 5 + 14000,
        isFinal: true,
        markers: [
          {
            id: 'm_s1_1',
            markerType: 'ACTIVE_LISTENING',
            candidateQuote: 'I completely understand how stressful unexpected charges are, especially right before an important rent payment.',
            impact: 'POSITIVE',
            coachingNote: 'Superb empathetic validation addressing both the emotional trigger and practical impact.',
            timestamp: Date.now() - 3600000 * 5 + 14000
          }
        ]
      },
      {
        id: 'msg_s1_3',
        speaker: 'AI Customer',
        text: "Thank you. Will this merchant be able to charge my card again next month? I've never even signed up with CloudStream Pro.",
        timestamp: Date.now() - 3600000 * 5 + 25000,
        isFinal: true
      },
      {
        id: 'msg_s1_4',
        speaker: 'Candidate',
        text: "Not at all. I have placed an active recurring token block on CloudStream Pro so any future settlement attempts will be automatically declined, and your card details remain completely secure.",
        timestamp: Date.now() - 3600000 * 5 + 42000,
        isFinal: true,
        markers: [
          {
            id: 'm_s1_2',
            markerType: 'DOMAIN_VOCABULARY',
            candidateQuote: 'active recurring token block on CloudStream Pro so any future settlement attempts will be automatically declined',
            impact: 'POSITIVE',
            coachingNote: 'Precise financial domain terminology delivered with reassuring clarity.',
            timestamp: Date.now() - 3600000 * 5 + 42000
          }
        ]
      },
      {
        id: 'msg_s1_5',
        speaker: 'AI Customer',
        text: "That is a huge relief. What is my reference number for this dispute?",
        timestamp: Date.now() - 3600000 * 5 + 56000,
        isFinal: true
      },
      {
        id: 'msg_s1_6',
        speaker: 'Candidate',
        text: "Your official dispute case number is APX-99421. The $45.00 provisional credit is already reflected in your available balance, so your rent payment will process smoothly tomorrow morning.",
        timestamp: Date.now() - 3600000 * 5 + 75000,
        isFinal: true,
        markers: [
          {
            id: 'm_s1_3',
            markerType: 'DE_ESCALATION',
            candidateQuote: 'The $45.00 provisional credit is already reflected in your available balance, so your rent payment will process smoothly',
            impact: 'POSITIVE',
            coachingNote: 'Proactive closure linking directly back to the customer initial anxiety point.',
            timestamp: Date.now() - 3600000 * 5 + 75000
          }
        ]
      }
    ]
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
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    initialSentimentScore: 35,
    finalSentimentScore: 82,
    initialTemperament: 'AGITATED_ANXIOUS',
    finalTemperament: 'SATISFIED_GRATEFUL',
    deEscalationOutcome: 'RESOLVED_AND_CALMED',
    deEscalationNotes: 'Customer was under severe pressure with an executive board presentation pending. Candidate calmly diagnosed the ONT telemetry and offered 5G backup (+47% sentiment swing).',
    transcript: [
      {
        id: 'msg_s2_1',
        speaker: 'AI Customer',
        text: "Hello! Our office fiber connection completely dropped five minutes ago, and we have a quarterly board presentation streaming in ten minutes! We have twelve executives in this boardroom. Can you tell me what happened to our link?",
        timestamp: Date.now() - 3600000 * 22 + 3000,
        isFinal: true
      },
      {
        id: 'msg_s2_2',
        speaker: 'Candidate',
        text: "Hello, I understand this is urgent with your board meeting approaching. I am checking the optical network terminal telemetry right now and see a signal attenuation fault at the street cabinet.",
        timestamp: Date.now() - 3600000 * 22 + 18000,
        isFinal: true,
        markers: [
          {
            id: 'm_s2_1',
            markerType: 'DOMAIN_VOCABULARY',
            candidateQuote: 'optical network terminal telemetry right now and see a signal attenuation fault',
            impact: 'POSITIVE',
            coachingNote: 'Correct technical vocabulary identifying terminal metrics.',
            timestamp: Date.now() - 3600000 * 22 + 18000
          }
        ]
      },
      {
        id: 'msg_s2_3',
        speaker: 'AI Customer',
        text: "How quickly can you dispatch someone? We can't wait hours!",
        timestamp: Date.now() - 3600000 * 22 + 32000,
        isFinal: true
      },
      {
        id: 'msg_s2_4',
        speaker: 'Candidate',
        text: "While I dispatch the line technician, I have remotely engaged your enterprise router 5G cellular backup gateway so your boardroom link is back online right now.",
        timestamp: Date.now() - 3600000 * 22 + 51000,
        isFinal: true,
        markers: [
          {
            id: 'm_s2_2',
            markerType: 'SOLUTION_OFFERING',
            candidateQuote: 'remotely engaged your enterprise router 5G cellular backup gateway',
            impact: 'POSITIVE',
            coachingNote: 'Immediate secondary mitigation minimizing downtime for the customer.',
            timestamp: Date.now() - 3600000 * 22 + 51000
          }
        ]
      }
    ]
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
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    transcript: [
      {
        id: 'msg_s3_1',
        speaker: 'AI Customer',
        text: "I placed an order three days ago for custom engraved headphones for my daughter's 16th birthday party tomorrow evening. The tracking status just updated to 'Delivered' but nothing was left at my front door! I am in tears right now.",
        timestamp: Date.now() - 3600000 * 48 + 2000,
        isFinal: true
      },
      {
        id: 'msg_s3_2',
        speaker: 'Candidate',
        text: "Please take a deep breath. A 16th birthday is a milestone moment, and I will personally make sure she has her gift tomorrow. Let me arrange an expedited replacement from our local distribution hub immediately.",
        timestamp: Date.now() - 3600000 * 48 + 16000,
        isFinal: true,
        markers: [
          {
            id: 'm_s3_1',
            markerType: 'ACTIVE_LISTENING',
            candidateQuote: 'A 16th birthday is a milestone moment, and I will personally make sure she has her gift tomorrow.',
            impact: 'POSITIVE',
            coachingNote: 'Exceptional emotional resonance validating parental priority with personal ownership.',
            timestamp: Date.now() - 3600000 * 48 + 16000
          }
        ]
      },
      {
        id: 'msg_s3_3',
        speaker: 'AI Customer',
        text: "Will it really arrive in time? Her party starts at 5:00 PM.",
        timestamp: Date.now() - 3600000 * 48 + 29000,
        isFinal: true
      },
      {
        id: 'msg_s3_4',
        speaker: 'Candidate',
        text: "Yes, I have routed the priority order via morning courier with a guaranteed delivery slot before 1:00 PM tomorrow, with all rush fees complimentary.",
        timestamp: Date.now() - 3600000 * 48 + 48000,
        isFinal: true,
        markers: [
          {
            id: 'm_s3_2',
            markerType: 'SOLUTION_OFFERING',
            candidateQuote: 'guaranteed delivery slot before 1:00 PM tomorrow, with all rush fees complimentary',
            impact: 'POSITIVE',
            coachingNote: 'Decisive, generous resolution exceeding customer service thresholds.',
            timestamp: Date.now() - 3600000 * 48 + 48000
          }
        ]
      }
    ]
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
      } else if (type === 'candidate_text' || type === 'candidate_speech') {
        const text = (data.text || '').trim();
        if (activeSession && text) {
          activeSession.handleClientText(text);
        } else if (text) {
          // Direct server response when in simulation mode or when activeSession is detached
          const replyId = 'rep_' + Date.now();
          ws.send(JSON.stringify({ type: 'reply_started', reply_id: replyId }));
          setTimeout(() => {
            let directReply = "Understood. Can you please confirm how long this dispute will take to fully resolve?";
            if (data.scenario === 'fintech_dispute') {
              directReply = "Alright, thank you for confirming. Will that provisional credit show up before tomorrow morning's rent check clears?";
            } else if (data.scenario === 'telecom_technical') {
              directReply = "Okay, our executive team is waiting. How many minutes until the 5G backup link activates?";
            } else if (data.scenario === 'ecommerce_delivery') {
              directReply = "I appreciate your help. Will the courier deliver the replacement parcel before 5:00 PM tomorrow?";
            }

            ws.send(JSON.stringify({
              type: 'transcript_final',
              speaker: 'AI Customer',
              text: directReply,
              reply_id: replyId
            }));

            ws.send(JSON.stringify({
              type: 'reply_done',
              reply_id: replyId
            }));
          }, 800);
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
