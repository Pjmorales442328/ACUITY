import { WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { ASSEMBLYAI_TOOLS, buildSystemPrompt } from './scoring_rubric';

const ASSEMBLYAI_WS_URL = 'wss://agents.assemblyai.com/v1/ws';

export class AssemblyAIVoiceAgentSession {
  private apiKey: string;
  private scenarioKey: string;
  private voice: string;
  private clientWs: WebSocket;
  private assemblyWs: WebSocket | null = null;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private maxDurationSeconds: number = 180;
  private watchdogInterval: any = null;
  private currentReplyId: string | null = null;
  private lastAgentFinalText: string = '';

  public liveScores = {
    fluency: 75,
    lexical: 75,
    grammar: 75,
    pronunciation: 80,
    empathy: 70
  };

  constructor(
    apiKey: string,
    scenarioKey: string,
    clientWs: WebSocket,
    voice: string = 'anna',
    maxDurationSeconds: number = 180
  ) {
    this.apiKey = apiKey;
    this.scenarioKey = scenarioKey;
    this.clientWs = clientWs;
    this.voice = voice || 'anna';
    this.maxDurationSeconds = maxDurationSeconds;
  }

  public async start() {
    this.isRunning = true;
    this.startTime = Date.now();

    const { prompt, greeting } = buildSystemPrompt(this.scenarioKey);

    console.log(`[AssemblyAI Session] Opening WebSocket connection to ${ASSEMBLYAI_WS_URL}...`);

    try {
      this.assemblyWs = new WebSocket(ASSEMBLYAI_WS_URL, {
        headers: {
          Authorization: this.apiKey
        }
      });

      this.assemblyWs.on('open', () => {
        console.log('[AssemblyAI Session] WebSocket connected. Sending initial session.update...');

        // Map voice selection to AssemblyAI supported voices (anna, ivy, james, sophie, etc.)
        let aaiVoice = 'anna';
        const vLower = (this.voice || '').toLowerCase();
        if (vLower.includes('fenrir') || vLower.includes('male') || vLower.includes('puck') || vLower.includes('james')) {
          aaiVoice = 'james';
        } else if (vLower.includes('ivy')) {
          aaiVoice = 'ivy';
        } else {
          aaiVoice = 'anna';
        }

        const updatePayload = {
          type: 'session.update',
          session: {
            system_prompt: prompt,
            greeting: greeting,
            input: {
              format: {
                encoding: 'audio/pcm',
                sample_rate: 24000
              }
            },
            output: {
              voice: aaiVoice,
              format: {
                encoding: 'audio/pcm',
                sample_rate: 24000
              }
            },
            tools: ASSEMBLYAI_TOOLS
          }
        };

        this.assemblyWs?.send(JSON.stringify(updatePayload));

        this.safeSendToClient({
          type: 'session_connected',
          mode: 'ASSEMBLYAI_VOICE_AGENT',
          scenario: this.scenarioKey,
          voice: aaiVoice,
          max_duration_seconds: this.maxDurationSeconds
        });

        // Start credit protection watchdog
        this.watchdogInterval = setInterval(() => {
          if (!this.isRunning) return;
          const elapsed = (Date.now() - this.startTime) / 1000;
          if (elapsed >= this.maxDurationSeconds) {
            console.log(`[AssemblyAI Session] Maximum duration reached (${this.maxDurationSeconds}s).`);
            this.safeSendToClient({
              type: 'safety_timeout',
              message: 'Assessment reached the 3-minute limit to preserve API allocation.'
            });
            this.stop();
          }
        }, 3000);
      });

      this.assemblyWs.on('message', (data: any, isBinary: boolean) => {
        if (!this.isRunning) return;

        if (isBinary) {
          // Binary audio chunk from AssemblyAI
          try {
            this.clientWs.send(data);
          } catch (e) {}
          return;
        }

        try {
          const textMsg = data.toString();
          const parsed = JSON.parse(textMsg);
          this.handleAssemblyAIEvent(parsed);
        } catch (e) {
          console.warn('[AssemblyAI Session] Error parsing incoming message:', e);
        }
      });

      this.assemblyWs.on('error', (err: any) => {
        console.error('[AssemblyAI Session] WebSocket error:', err?.message || err);
        this.safeSendToClient({
          type: 'session_error',
          error: err?.message || 'AssemblyAI connection error'
        });
      });

      this.assemblyWs.on('close', (code, reason) => {
        console.log(`[AssemblyAI Session] Connection closed (${code}): ${reason.toString()}`);
        this.cleanup();
      });

    } catch (err: any) {
      console.error('[AssemblyAI Session] Failed to initialize connection:', err);
      this.safeSendToClient({
        type: 'session_error',
        error: err?.message || 'Failed to connect to AssemblyAI Voice Agent'
      });
      this.cleanup();
    }
  }

  private handleAssemblyAIEvent(msg: any) {
    const type = msg.type;

    if (type === 'reply.audio') {
      // Audio chunk from AssemblyAI customer speech (base64 PCM 24kHz)
      this.safeSendToClient({
        type: 'audio_chunk',
        data: msg.data,
        sample_rate: 24000
      });
    } else if (type === 'reply.started') {
      const replyId = msg.reply_id || ('rep_' + Date.now());
      this.currentReplyId = replyId;
      this.lastAgentFinalText = '';
      this.safeSendToClient({
        type: 'reply_started',
        reply_id: replyId,
        item_id: msg.item_id
      });
    } else if (type === 'transcript.agent.delta') {
      // Partial streaming text of customer speaking
      const replyId = msg.reply_id || this.currentReplyId || ('rep_' + Date.now());
      this.currentReplyId = replyId;
      this.safeSendToClient({
        type: 'transcript_delta',
        speaker: 'AI Customer',
        delta: msg.delta,
        item_id: msg.item_id,
        reply_id: replyId,
        is_final: false
      });
    } else if (type === 'transcript.user.delta') {
      // Partial streaming text of candidate speaking into microphone
      this.safeSendToClient({
        type: 'transcript_delta',
        speaker: 'Candidate',
        text: msg.text,
        delta: msg.delta || msg.text,
        item_id: msg.item_id,
        is_final: false
      });
    } else if (type === 'input.speech.started') {
      this.safeSendToClient({
        type: 'input_speech_started'
      });
    } else if (type === 'input.speech.stopped') {
      this.safeSendToClient({
        type: 'input_speech_stopped'
      });
    } else if (type === 'interruption') {
      // Candidate barged in while customer was speaking
      console.log('[AssemblyAI Session] Barge-in interruption detected by server VAD.');
      this.safeSendToClient({
        type: 'barge_in_interrupted'
      });
    } else if (type === 'tool.call' || type === 'tool_call') {
      const toolCall = msg.tool_call || msg;
      const callId = toolCall.id || msg.call_id || msg.id || 'call_' + Date.now();
      const toolName = toolCall.name || msg.name;
      let rawArgs = toolCall.arguments || msg.arguments || {};
      if (typeof rawArgs === 'string') {
        try {
          rawArgs = JSON.parse(rawArgs);
        } catch (e) {}
      }

      console.log(`[AssemblyAI Session] Tool invoked: ${toolName}`, rawArgs);
      this.executeTool(toolName, rawArgs);

      // Reply back to AssemblyAI Voice Agent with tool.result
      try {
        this.assemblyWs?.send(
          JSON.stringify({
            type: 'tool.result',
            id: callId,
            call_id: callId,
            tool_call_id: callId,
            result: JSON.stringify({ status: 'SUCCESS', tool: toolName })
          })
        );
      } catch (e) {}
    } else if (type === 'session.ready' || type === 'session.updated') {
      console.log(`[AssemblyAI Session] Event received: ${type}`);
      this.safeSendToClient({
        type: 'session_ready',
        session_id: msg.session_id
      });
    } else if (type === 'reply.done') {
      const replyId = msg.reply_id || this.currentReplyId || ('rep_' + Date.now());
      const isInterrupted = msg.status === 'interrupted' || msg.interrupted === true;
      if (isInterrupted) {
        console.log('[AssemblyAI Session] reply.done with status interrupted: barge-in confirmed');
        this.safeSendToClient({
          type: 'barge_in_interrupted',
          reply_id: replyId
        });
      }
      this.safeSendToClient({
        type: 'reply_done',
        reply_id: replyId,
        interrupted: isInterrupted
      });
      // Conclude active reply lifecycle
      this.currentReplyId = null;
      this.lastAgentFinalText = '';
    } else if (type === 'transcript.agent') {
      const replyId = msg.reply_id || this.currentReplyId || ('rep_' + Date.now());
      const rawText = (msg.text || msg.transcript || '').trim();
      // Deduplicate if identical final transcript text was already emitted for this turn
      if (rawText && rawText === this.lastAgentFinalText) {
        return;
      }
      if (rawText) {
        this.lastAgentFinalText = rawText;
      }
      this.safeSendToClient({
        type: 'transcript_final',
        speaker: 'AI Customer',
        text: rawText,
        item_id: msg.item_id,
        reply_id: replyId,
        interrupted: !!msg.interrupted
      });
    } else if (type === 'transcript.user') {
      this.safeSendToClient({
        type: 'transcript_final',
        speaker: 'Candidate',
        text: msg.text || msg.transcript || '',
        item_id: msg.item_id
      });
    } else if (type === 'session.error') {
      console.warn('[AssemblyAI Session] Error event:', msg);
      this.safeSendToClient({
        type: 'session_error',
        error: msg.message || 'AssemblyAI session error',
        code: msg.code
      });
    }
  }

  private executeTool(name: string, args: any) {
    if (name === 'log_conversational_marker') {
      const impact = args.impact || 'NEUTRAL';
      const delta = impact === 'POSITIVE' ? 3 : impact === 'NEGATIVE' ? -4 : 0;
      const markerType = (args.marker_type || '').toUpperCase();

      if (markerType.includes('EMPATHY')) {
        this.liveScores.empathy = Math.max(30, Math.min(98, this.liveScores.empathy + delta * 2));
      } else if (markerType.includes('VOCABULARY')) {
        this.liveScores.lexical = Math.max(30, Math.min(98, this.liveScores.lexical + delta));
      } else if (markerType.includes('GRAMMAR')) {
        this.liveScores.grammar = Math.max(30, Math.min(98, this.liveScores.grammar + delta));
      } else if (markerType.includes('HESITATION') || markerType.includes('FILLER')) {
        this.liveScores.fluency = Math.max(30, Math.min(98, this.liveScores.fluency - 4));
      }

      this.safeSendToClient({
        type: 'tool_call',
        tool_name: 'log_conversational_marker',
        args
      });

      this.safeSendToClient({
        type: 'score_update',
        scores: this.liveScores
      });
    } else if (name === 'update_customer_temperament') {
      this.safeSendToClient({
        type: 'tool_call',
        tool_name: 'update_customer_temperament',
        args
      });
    } else if (name === 'generate_candidate_scorecard') {
      this.safeSendToClient({
        type: 'interview_completed',
        scorecard: args
      });
    }
  }

  public handleClientAudioChunk(base64Data: string) {
    if (!this.assemblyWs || this.assemblyWs.readyState !== WebSocket.OPEN) return;
    try {
      this.lastAgentFinalText = '';
      this.assemblyWs.send(
        JSON.stringify({
          type: 'input.audio',
          audio: base64Data
        })
      );
    } catch (e) {
      console.warn('[AssemblyAI Session] Error sending audio chunk to AssemblyAI:', e);
    }
  }

  public handleClientBinaryAudio(buffer: Buffer) {
    if (!this.assemblyWs || this.assemblyWs.readyState !== WebSocket.OPEN) return;
    try {
      this.lastAgentFinalText = '';
      this.assemblyWs.send(
        JSON.stringify({
          type: 'input.audio',
          audio: buffer.toString('base64')
        })
      );
    } catch (e) {
      console.warn('[AssemblyAI Session] Error sending binary audio to AssemblyAI:', e);
    }
  }

  public async handleClientText(text: string) {
    if (!text?.trim()) return;
    this.lastAgentFinalText = '';
    const cleanText = text.trim();

    let fedToAssembly = false;
    if (this.assemblyWs && this.assemblyWs.readyState === WebSocket.OPEN) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-tts-preview',
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
              }
            }
          });
          const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && this.assemblyWs && this.assemblyWs.readyState === WebSocket.OPEN) {
            const audioBuf = Buffer.from(audioBase64, 'base64');
            const chunkSize = 4800; // 100ms at 24kHz 16-bit PCM
            for (let offset = 0; offset < audioBuf.length; offset += chunkSize) {
              const chunk = audioBuf.subarray(offset, Math.min(offset + chunkSize, audioBuf.length));
              this.assemblyWs.send(
                JSON.stringify({
                  type: 'input.audio',
                  audio: chunk.toString('base64')
                })
              );
              await new Promise(r => setTimeout(r, 45));
            }
            // Send trailing silence frames so VAD immediately stops speech and Jordan replies in < 1 second!
            const silenceChunk = Buffer.alloc(chunkSize);
            for (let i = 0; i < 6; i++) {
              if (this.assemblyWs && this.assemblyWs.readyState === WebSocket.OPEN) {
                this.assemblyWs.send(
                  JSON.stringify({
                    type: 'input.audio',
                    audio: silenceChunk.toString('base64')
                  })
                );
                await new Promise(r => setTimeout(r, 45));
              }
            }
            fedToAssembly = true;
          }
        }
      } catch (e) {
        console.warn('[AssemblyAI Session] Error synthesizing candidate text to speech:', e);
      }

      // If audio wasn't fed, try text input
      if (!fedToAssembly && this.assemblyWs && this.assemblyWs.readyState === WebSocket.OPEN) {
        try {
          this.assemblyWs.send(
            JSON.stringify({
              type: 'input.text',
              text: cleanText
            })
          );
          fedToAssembly = true;
        } catch (e) {}
      }
    }

    // Customer turn watchdog: If AssemblyAI does not begin responding within 3.5s, generate prompt reply
    setTimeout(() => {
      if (this.isRunning && !this.currentReplyId && this.clientWs.readyState === WebSocket.OPEN) {
        console.log('[AssemblyAI Session] Customer watchdog triggered: dispatching fallback turn.');
        const fallbackReplyId = 'rep_' + Date.now();
        this.currentReplyId = fallbackReplyId;
        this.safeSendToClient({
          type: 'reply_started',
          reply_id: fallbackReplyId
        });

        let fallbackMsg = "I understand what you're saying, but I need to make sure this is confirmed right now. Can you clarify the exact next step?";
        if (this.scenarioKey === 'fintech_dispute') {
          fallbackMsg = "Okay, I appreciate you explaining that. Will the $45.00 credit be available before my rent payment clears tomorrow morning?";
        } else if (this.scenarioKey === 'telecom_technical') {
          fallbackMsg = "Alright, our executives are already seated in the boardroom. How quickly will that backup connection take over?";
        } else if (this.scenarioKey === 'ecommerce_delivery') {
          fallbackMsg = "Thank you. Is there a tracking number for the replacement gift so I can verify delivery before tomorrow afternoon?";
        }

        this.safeSendToClient({
          type: 'transcript_final',
          speaker: 'AI Customer',
          text: fallbackMsg,
          reply_id: fallbackReplyId
        });

        this.safeSendToClient({
          type: 'reply_done',
          reply_id: fallbackReplyId
        });

        this.currentReplyId = null;
      }
    }, 3500);
  }

  public stop() {
    this.cleanup();
  }

  private cleanup() {
    this.isRunning = false;
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
    if (this.assemblyWs) {
      try {
        this.assemblyWs.close();
      } catch (e) {}
      this.assemblyWs = null;
    }
  }

  private safeSendToClient(payload: any) {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      try {
        this.clientWs.send(JSON.stringify(payload));
      } catch (e) {}
    }
  }
}
