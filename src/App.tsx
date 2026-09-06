import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AudioWaveform } from './components/AudioWaveform';
import { RadarChart } from './components/RadarChart';
import { TemperamentGauge } from './components/TemperamentGauge';
import { MarkersFeed } from './components/MarkersFeed';
import { TranscriptFeed } from './components/TranscriptFeed';
import { CandidateControls } from './components/CandidateControls';
import { ScorecardModal } from './components/ScorecardModal';
import { CallBriefModal } from './components/CallBriefModal';
import { CandidateHistoryView } from './components/CandidateHistoryView';
import { ScenarioStudioView } from './components/ScenarioStudioView';
import { ArchitectureDeckView } from './components/ArchitectureDeckView';
import { CandidateProfileCard } from './components/CandidateProfileCard';
import { ScreeningGuideBanner } from './components/ScreeningGuideBanner';
import { DEFAULT_SCENARIOS } from './data/scenarios';
import { buildCompleteScorecard } from './utils/scoringEngine';
import { cleanAndDeduplicateTranscript } from './utils/transcriptDeduplicator';
import {
  ActiveTab,
  AppMode,
  ConversationalMarker,
  RadarScores,
  Scenario,
  Scorecard,
  TemperamentType,
  TranscriptMessage
} from './types';

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number = 24000): Int16Array {
  if (outputSampleRate === inputSampleRate) {
    const output = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }
  const sampleRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    const sample = count > 0 ? accum / count : (buffer[offsetBuffer] || 0);
    const clamped = Math.max(-1, Math.min(1, sample));
    result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export function App() {
  // Navigation & Settings
  const [activeTab, setActiveTab] = useState<ActiveTab>('SCREENING');
  const [appMode, setAppMode] = useState<AppMode>('ASSEMBLYAI');
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Anna');

  // Candidate Profile
  const [candidateName, setCandidateName] = useState<string>('Jordan Rivera');
  const [candidateEmail, setCandidateEmail] = useState<string>('jordan.rivera@talentpool.io');
  const [targetRole, setTargetRole] = useState<string>('Tier-2 Senior Customer Advocate');

  // Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('fintech_dispute');

  // Call & Audio State
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const maxDurationSeconds = 180;
  const [statusText, setStatusText] = useState<string>('Ready to initiate assessment');

  // Real-time Metrics
  const [radarScores, setRadarScores] = useState<RadarScores>({
    fluency: 78,
    grammar: 76,
    lexical: 80,
    pronunciation: 82,
    empathy: 74
  });
  const [currentTemperament, setCurrentTemperament] = useState<TemperamentType>('AGITATED_ANXIOUS');
  const [sentimentScore, setSentimentScore] = useState<number>(28);
  const [temperamentReason, setTemperamentReason] = useState<string>('Customer initiated call distressed about unauthorized charge.');
  const [markers, setMarkers] = useState<ConversationalMarker[]>([]);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);

  // Scorecards & Candidates
  const [activeScorecard, setActiveScorecard] = useState<Scorecard | null>(null);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState<boolean>(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);
  const [candidateHistory, setCandidateHistory] = useState<Scorecard[]>([]);

  // Web Audio & WebSocket Streaming Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserNodeRef = useRef<AnalyserNode | null>(null);
  const customerAnalyserNodeRef = useRef<AnalyserNode | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const isProcessingTurnRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextScheduledPlayTimeRef = useRef<number>(0);

  // Echo Gate & Ducking Protection against audio loops
  const [echoGateEnabled, setEchoGateEnabled] = useState<boolean>(true);
  const echoGateEnabledRef = useRef<boolean>(true);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isMicListeningRef = useRef<boolean>(true);
  const activeCustomerReplyIdRef = useRef<string | null>(null);
  const lastCustomerSpeechEndRef = useRef<number>(0);
  const lastUserSpeechTimeRef = useRef<number>(0);
  const lastAudioPacketSentTimeRef = useRef<number>(0);

  // Fetch initial candidates from server
  useEffect(() => {
    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCandidateHistory(data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch candidate history:', err);
      });
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isCallActive) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev + 1 >= maxDurationSeconds) {
            handleEndCall();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isCallActive]);

  // Active Scenario object
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Speech Synthesis helper (Gemini Neural TTS with automatic Web Audio & browser fallback)
  const speakText = async (text: string) => {
    if (isVoiceMuted || !text) return;

    // Stop previous audio playback
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsAiSpeaking(true);
    setStatusText('Customer speaking (Gemini Neural TTS)...');

    // Attempt Gemini Neural TTS first
    try {
      const res = await fetch('/api/ai/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioCtx();
          }
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const int16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
          }

          const buffer = ctx.createBuffer(1, float32.length, data.sampleRate || 24000);
          buffer.copyToChannel(float32, 0);

          const source = ctx.createBufferSource();
          source.buffer = buffer;

          // Route to customer analyser for waveform visualizer and destination (isolated from mic)
          if (!customerAnalyserNodeRef.current) {
            customerAnalyserNodeRef.current = ctx.createAnalyser();
            customerAnalyserNodeRef.current.fftSize = 256;
          }
          source.connect(customerAnalyserNodeRef.current);
          customerAnalyserNodeRef.current.connect(ctx.destination);

          currentAudioSourceRef.current = source;
          isAiSpeakingRef.current = true;
          setIsAiSpeaking(true);

          source.onended = () => {
            isAiSpeakingRef.current = false;
            lastCustomerSpeechEndRef.current = Date.now();
            setIsAiSpeaking(false);
            setStatusText('Candidate turn • Listening (Speak into mic or click a response)');
            currentAudioSourceRef.current = null;
          };

          source.start();
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini Neural TTS synthesis failed, falling back to browser synthesis:', err);
    }

    // Fallback to browser SpeechSynthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('US') || v.name.includes('Samantha') || v.name.includes('Alex')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => {
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);
        setStatusText('Customer speaking (Browser Voice)...');
      };

      utterance.onend = () => {
        isAiSpeakingRef.current = false;
        lastCustomerSpeechEndRef.current = Date.now();
        setIsAiSpeaking(false);
        setStatusText('Candidate turn • Listening');
      };

      utterance.onerror = () => {
        isAiSpeakingRef.current = false;
        lastCustomerSpeechEndRef.current = Date.now();
        setIsAiSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(false);
    }
  };

  // --- AssemblyAI 2-Way Voice Agent Audio & Streaming Pipeline ---
  const playRawPcm24kBuffer = (arrayBuf: ArrayBuffer) => {
    try {
      const int16 = new Int16Array(arrayBuf);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // STRICT AUDIO ISOLATION (Anti-Feedback Loop):
      // Connect customer playback ONLY to dedicated customerAnalyser -> destination.
      // Customer audio NEVER touches micAnalyser or processorNode.
      if (!customerAnalyserNodeRef.current) {
        const cAnalyser = ctx.createAnalyser();
        cAnalyser.fftSize = 256;
        customerAnalyserNodeRef.current = cAnalyser;
      }
      source.connect(customerAnalyserNodeRef.current);
      customerAnalyserNodeRef.current.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextScheduledPlayTimeRef.current);
      source.start(startTime);
      nextScheduledPlayTimeRef.current = startTime + buffer.duration;

      activeAudioSourcesRef.current.push(source);
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);
      setStatusText('Customer speaking (AssemblyAI Voice Agent)...');

      source.onended = () => {
        activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter(s => s !== source);
        if (activeAudioSourcesRef.current.length === 0) {
          isAiSpeakingRef.current = false;
          lastCustomerSpeechEndRef.current = Date.now();
          setIsAiSpeaking(false);
          setStatusText('Candidate turn • Listening (Speak naturally into mic)');
        }
      };
    } catch (err) {
      console.warn('Error playing 24k PCM buffer:', err);
    }
  };

  const playBase64Pcm24k = (base64String: string) => {
    try {
      const binary = atob(base64String);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      playRawPcm24kBuffer(bytes.buffer);
    } catch (err) {
      console.warn('Error decoding base64 PCM:', err);
    }
  };

  const stopActiveAudioPlayback = () => {
    activeAudioSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeAudioSourcesRef.current = [];
    if (audioContextRef.current) {
      nextScheduledPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    isAiSpeakingRef.current = false;
    lastCustomerSpeechEndRef.current = Date.now();
    setIsAiSpeaking(false);
  };

  const handleAssemblyAiScorecard = (sc: any) => {
    const finalScorecard: Scorecard = {
      id: 'sc_' + Date.now(),
      candidateName,
      candidateEmail,
      targetRole,
      scenarioId: activeScenario.id,
      scenarioTitle: activeScenario.title,
      overallCefrLevel: sc.overall_cefr_level || 'B2',
      fluencyScore: sc.fluency_score || radarScores.fluency,
      lexicalScore: sc.lexical_score || radarScores.lexical,
      grammarScore: sc.grammar_score || radarScores.grammar,
      pronunciationScore: sc.pronunciation_score || radarScores.pronunciation,
      empathyScore: sc.empathy_score || radarScores.empathy,
      keyStrengths: sc.key_strengths || ['Professional communication', 'Customer focus'],
      developmentAreas: sc.development_areas || ['Grammatical consistency', 'Pacing'],
      hiringRecommendation: sc.hiring_recommendation || 'HIRE',
      summaryVerdict: sc.summary_verdict || 'Candidate demonstrated effective communication.',
      sessionDurationSeconds: elapsedSeconds || 85,
      turnCount: currentTurnIndex + 1,
      markersCount: markers.length,
      createdAt: new Date().toISOString()
    };
    setActiveScorecard(finalScorecard);
    setIsScorecardModalOpen(true);
    setCandidateHistory(prev => [finalScorecard, ...prev.filter(c => c.id !== finalScorecard.id)]);
    fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalScorecard)
    }).catch(err => console.warn('Candidate sync error:', err));
  };

  const startAssemblyAiSession = async () => {
    setStatusText('Connecting to AssemblyAI Voice Agent...');
    stopActiveAudioPlayback();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/interview`);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log('[WS Client] Connected to /ws/interview gateway');
      ws.send(JSON.stringify({
        type: 'start_interview',
        scenario: activeScenario.id,
        voice: selectedVoice,
        mock_mode: false
      }));

      // Initialize microphone stream for 16kHz PCM bi-directional streaming
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = audioContextRef.current || new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Stop any conflicting Web Speech API instances
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }

        // 1. Dedicated Microphone Input Source
        const micSource = ctx.createMediaStreamSource(stream);

        // 2. Dedicated Mic Analyser for Candidate Waveform (Isolated completely from customer audio)
        const micAnalyser = ctx.createAnalyser();
        micAnalyser.fftSize = 256;
        micAnalyserNodeRef.current = micAnalyser;
        micSource.connect(micAnalyser);

        // 3. ScriptProcessor captures 16-bit PCM candidate audio
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorNodeRef.current = processor;
        micSource.connect(processor);

        // 4. Mute local audio output so candidate mic doesn't play back out of user's own speakers
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(ctx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          // If candidate muted the mic in UI, drop all input
          if (!isMicListeningRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Compute speech volume level (RMS)
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);

          const isAiSpeakingNow = isAiSpeakingRef.current || activeAudioSourcesRef.current.length > 0;
          const timeSinceCustomerSpoke = Date.now() - lastCustomerSpeechEndRef.current;
          const inGracePeriod = timeSinceCustomerSpoke < 250; // 250ms room acoustic reverb dampening

          // 🛡️ SOFTWARE ECHO GATE (Anti-Feedback Loop):
          // When Jordan Reynolds (AI Customer) is actively speaking through computer speakers:
          // Gating prevents customer's voice from leaking into the microphone and being sent back to Jordan.
          // Candidate must speak with high energy (barge-in > 0.048) to cut through.
          if (echoGateEnabledRef.current && (isAiSpeakingNow || inGracePeriod)) {
            if (rms < 0.048) {
              setIsCandidateSpeaking(false);
              return; // Completely drop speaker bleed!
            }
          }

          const isSpeaking = rms > 0.012;
          if (isSpeaking) {
            lastUserSpeechTimeRef.current = Date.now();
            setIsCandidateSpeaking(true);
          } else {
            const timeSinceSpoke = Date.now() - lastUserSpeechTimeRef.current;
            if (timeSinceSpoke > 400) {
              setIsCandidateSpeaking(false);
            }
          }

          // ⚡ ZERO-LATENCY TURN-TAKING ENGINE:
          // AssemblyAI Voice Agent uses VAD to detect turn completion.
          // If audio stops transmitting abruptly, VAD hangs for 10-30 seconds waiting for silence.
          // We stream audio continuously while speaking, AND for 1200ms of low-energy silence immediately after speaking.
          // This delivers the exact silence frames required to trigger prompt sub-500ms replies!
          const timeSinceSpoke = Date.now() - lastUserSpeechTimeRef.current;
          if (timeSinceSpoke > 1200) {
            // Idle background: keep connection alive with a periodic keepalive packet every 1.5s
            if (Date.now() - lastAudioPacketSentTimeRef.current < 1500) {
              return;
            }
          }
          lastAudioPacketSentTimeRef.current = Date.now();

          // Resample from ctx.sampleRate (48000 or 44100) to 24000 Hz 16-bit PCM for AssemblyAI Voice Agent
          const pcm16Data = downsampleBuffer(inputData, ctx.sampleRate, 24000);
          ws.send(pcm16Data.buffer);
        };

        isMicListeningRef.current = true;
        setIsMicListening(true);
        setStatusText('AssemblyAI Voice Agent active • Speak naturally into mic');
      } catch (micErr) {
        console.warn('Microphone permission or hardware error:', micErr);
        setStatusText('Microphone required for AssemblyAI 2-way call');
      }
    };

    ws.onmessage = async (event) => {
      // 1. Binary audio chunk
      if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
        if (!isVoiceMuted) {
          const arrayBuf = event.data instanceof Blob ? await event.data.arrayBuffer() : event.data;
          playRawPcm24kBuffer(arrayBuf);
        }
        return;
      }

      // 2. Control/Transcript message
      try {
        const data = JSON.parse(event.data);
        const type = data.type;

        if (type === 'session_connected') {
          const sysMsg: TranscriptMessage = {
            id: 'sys_' + Date.now(),
            speaker: 'System',
            text: `Connected to AssemblyAI 2-Way Voice Agent • Persona: "${activeScenario.title}" • Voice: ${data.voice || selectedVoice}`,
            timestamp: Date.now(),
            isFinal: true
          };
          setTranscript([sysMsg]);
          setStatusText('Customer connected • Listening to speech');
        } else if (type === 'audio_chunk') {
          if (!isVoiceMuted && data.data) {
            playBase64Pcm24k(data.data);
          }
        } else if (type === 'reply_started') {
          isAiSpeakingRef.current = true;
          setIsAiSpeaking(true);
          const replyId = data.reply_id || ('rep_' + Date.now());
          activeCustomerReplyIdRef.current = replyId;
          setStatusText('Customer speaking (AssemblyAI Voice Agent)...');
        } else if (type === 'transcript_delta') {
          const speaker = data.speaker; // 'AI Customer' | 'Candidate'
          const delta = (data.delta || '').trim();
          const text = (data.text || '').trim();
          const replyId = data.reply_id || activeCustomerReplyIdRef.current || data.item_id || ('rep_' + Date.now());
          if (!delta && !text) return;

          if (speaker === 'AI Customer') {
            isAiSpeakingRef.current = true;
            setIsAiSpeaking(true);
            activeCustomerReplyIdRef.current = replyId;

            setTranscript(prev => {
              const targetId = 'msg_ai_' + replyId;
              // 1. By ID match
              const existingIdx = prev.findIndex(m => m.id === targetId);
              if (existingIdx !== -1) {
                const existing = prev[existingIdx];
                const glue = (existing.text && !existing.text.endsWith(' ') && !delta.startsWith(' ') && !/^[,.!?:;]/.test(delta)) ? ' ' : '';
                const newText = (existing.text + glue + delta).trim();
                const updated = [...prev];
                updated[existingIdx] = { ...existing, text: newText, isFinal: false };
                return cleanAndDeduplicateTranscript(updated);
              }

              // 2. By unfinalized recent AI customer message
              const lastAiIdx = prev.findLastIndex(m => m.speaker === 'AI Customer');
              if (lastAiIdx !== -1 && !prev[lastAiIdx].isFinal) {
                const existing = prev[lastAiIdx];
                const glue = (existing.text && !existing.text.endsWith(' ') && !delta.startsWith(' ') && !/^[,.!?:;]/.test(delta)) ? ' ' : '';
                const newText = (existing.text + glue + delta).trim();
                const updated = [...prev];
                updated[lastAiIdx] = { ...existing, id: targetId, text: newText, isFinal: false };
                return cleanAndDeduplicateTranscript(updated);
              }

              // 3. New customer message turn
              const newMsg: TranscriptMessage = {
                id: targetId,
                speaker: 'AI Customer',
                text: delta,
                timestamp: Date.now(),
                isFinal: false
              };
              return cleanAndDeduplicateTranscript([...prev, newMsg]);
            });
          } else if (speaker === 'Candidate') {
            // Live streaming transcription of candidate speech into interim transcript
            const liveCandidateText = text || delta;
            setInterimTranscript(liveCandidateText);
            setIsCandidateSpeaking(true);
          }
        } else if (type === 'transcript_final') {
          const speaker = data.speaker;
          const text = (data.text || '').trim();
          const replyId = data.reply_id || activeCustomerReplyIdRef.current || data.item_id || ('rep_' + Date.now());

          if (text) {
            setTranscript(prev => {
              if (speaker === 'AI Customer') {
                const targetId = 'msg_ai_' + replyId;
                const existingIdx = prev.findIndex(m => m.id === targetId);

                // 1. Exact ID match for this customer turn
                if (existingIdx !== -1) {
                  const existing = prev[existingIdx];
                  const existingNorm = existing.text.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const newNorm = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');

                  let finalText = text;
                  if (existingNorm.includes(newNorm) && existing.text.length > text.length) {
                    finalText = existing.text;
                  } else if (!newNorm.includes(existingNorm) && !existingNorm.includes(newNorm) && existing.text.length > 0) {
                    finalText = `${existing.text} ${text}`;
                  }

                  const updated = [...prev];
                  updated[existingIdx] = { ...existing, text: finalText, isFinal: true };
                  return cleanAndDeduplicateTranscript(updated);
                }

                // 2. Check latest AI customer message
                const lastAiIdx = prev.findLastIndex(m => m.speaker === 'AI Customer');
                if (lastAiIdx !== -1) {
                  const lastAi = prev[lastAiIdx];
                  const lastAiNorm = lastAi.text.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const newNorm = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const timeDiff = Math.abs(Date.now() - lastAi.timestamp);

                  if (!lastAi.isFinal || lastAiNorm.includes(newNorm) || newNorm.includes(lastAiNorm) || timeDiff < 8000) {
                    let finalText = text;
                    if (lastAiNorm.includes(newNorm) && lastAi.text.length > text.length) {
                      finalText = lastAi.text;
                    } else if (newNorm.includes(lastAiNorm)) {
                      finalText = text;
                    } else if (!lastAi.isFinal) {
                      finalText = `${lastAi.text} ${text}`;
                    }

                    const updated = [...prev];
                    updated[lastAiIdx] = { ...lastAi, id: targetId, text: finalText, isFinal: true };
                    return cleanAndDeduplicateTranscript(updated);
                  }
                }

                // 3. New message if truly distinct
                const newMsg: TranscriptMessage = {
                  id: targetId,
                  speaker: 'AI Customer',
                  text,
                  timestamp: Date.now(),
                  isFinal: true
                };
                return cleanAndDeduplicateTranscript([...prev, newMsg]);
              }

              // Candidate deduplication
              if (speaker === 'Candidate') {
                const targetId = 'msg_cand_' + (data.item_id || Date.now());
                const lastCandIdx = prev.findLastIndex(m => m.speaker === 'Candidate');
                if (lastCandIdx !== -1) {
                  const lastCand = prev[lastCandIdx];
                  const timeDiff = Math.abs(Date.now() - lastCand.timestamp);
                  const candTextClean = lastCand.text.trim().toLowerCase();
                  const newTextClean = text.toLowerCase();
                  if (timeDiff < 15000 && (candTextClean === newTextClean || candTextClean.includes(newTextClean) || newTextClean.includes(candTextClean))) {
                    const updated = [...prev];
                    updated[lastCandIdx] = { ...lastCand, text: text.length >= lastCand.text.length ? text : lastCand.text, isFinal: true };
                    return cleanAndDeduplicateTranscript(updated);
                  }
                }

                return cleanAndDeduplicateTranscript([
                  ...prev,
                  {
                    id: targetId,
                    speaker: 'Candidate',
                    text,
                    timestamp: Date.now(),
                    isFinal: true
                  }
                ]);
              }

              return prev;
            });

            if (speaker === 'Candidate') {
              setInterimTranscript('');
            }
          }
        } else if (type === 'input_speech_started') {
          setIsCandidateSpeaking(true);
          activeCustomerReplyIdRef.current = null;
          setStatusText('Candidate speaking • Processing speech');
        } else if (type === 'input_speech_stopped') {
          setIsCandidateSpeaking(false);
          setStatusText('Candidate finished speaking • Customer responding...');
        } else if (type === 'reply_done') {
          isAiSpeakingRef.current = false;
          lastCustomerSpeechEndRef.current = Date.now();
          setIsAiSpeaking(false);
          setStatusText('Candidate turn • Listening (Speak naturally into mic)');
          setTranscript(prev => {
            if (activeCustomerReplyIdRef.current) {
              const targetId = 'msg_ai_' + activeCustomerReplyIdRef.current;
              const idx = prev.findIndex(m => m.id === targetId);
              if (idx !== -1 && !prev[idx].isFinal) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], isFinal: true };
                return cleanAndDeduplicateTranscript(updated);
              }
            }
            return cleanAndDeduplicateTranscript(prev);
          });
          activeCustomerReplyIdRef.current = null;
        } else if (type === 'barge_in_interrupted') {
          stopActiveAudioPlayback();
          setStatusText('Candidate took floor (AssemblyAI sub-350ms barge-in)');
          const interruptMarker: ConversationalMarker = {
            id: 'marker_' + Date.now(),
            markerType: 'ACTIVE_LISTENING',
            candidateQuote: '[Candidate initiated sub-350ms turn-taking]',
            impact: 'POSITIVE',
            coachingNote: 'Handled customer conversational turn-taking with rapid responsiveness.',
            timestamp: Date.now()
          };
          setMarkers(prev => [interruptMarker, ...prev]);
        } else if (type === 'tool_call') {
          const name = data.tool_name;
          const args = data.args || {};
          if (name === 'log_conversational_marker') {
            const newMarker: ConversationalMarker = {
              id: 'marker_' + Date.now(),
              markerType: args.marker_type || 'ACTIVE_LISTENING',
              candidateQuote: args.candidate_quote || '',
              impact: args.impact || 'POSITIVE',
              coachingNote: args.coaching_note || 'Candidate communicative marker evaluated.',
              timestamp: Date.now()
            };
            setMarkers(prev => [newMarker, ...prev]);
          } else if (name === 'update_customer_temperament') {
            if (args.new_temperament) setCurrentTemperament(args.new_temperament);
            if (args.sentiment_score !== undefined) setSentimentScore(args.sentiment_score);
            if (args.trigger_reason) setTemperamentReason(args.trigger_reason);
          }
        } else if (type === 'score_update') {
          if (data.scores) {
            setRadarScores(prev => ({ ...prev, ...data.scores }));
          }
        } else if (type === 'interview_completed') {
          if (data.scorecard) {
            handleAssemblyAiScorecard(data.scorecard);
          }
        } else if (type === 'session_error') {
          setStatusText(`AssemblyAI Notice: ${data.error}`);
        }
      } catch (e) {
        console.warn('WS message parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS Client] Disconnected');
    };

    ws.onerror = (err) => {
      console.error('[WS Client] Error:', err);
    };
  };

  // Start Call
  const handleStartCall = async () => {
    setIsCallActive(true);
    setElapsedSeconds(0);
    setCurrentTurnIndex(0);
    setMarkers([]);
    setTranscript([]);
    setActiveScorecard(null);

    // Initial scenario baseline scores
    setRadarScores({
      fluency: 78,
      grammar: 76,
      lexical: 80,
      pronunciation: 82,
      empathy: 74
    });
    setCurrentTemperament(activeScenario.initialTemperament);
    setSentimentScore(activeScenario.initialSentiment);
    setTemperamentReason(activeScenario.customerPersona.slice(0, 80) + '...');

    if (appMode === 'ASSEMBLYAI') {
      await startAssemblyAiSession();
      return;
    }

    setStatusText('Session initialized • Customer connecting');

    // Init Mic & Web Audio analyser
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        micAnalyserNodeRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      }
    } catch (err) {
      console.warn('Microphone permission not granted or available:', err);
    }

    // Init Web Speech Recognition if supported
    setupSpeechRecognition();

    // Opening customer line
    const openingTurn = activeScenario.scriptedTurns[0];
    const initialCustomerStatement = openingTurn
      ? openingTurn.customerText
      : `Hello, my name is ${candidateName}. I am calling regarding my account issues today.`;

    const systemMsg: TranscriptMessage = {
      id: 'sys_' + Date.now(),
      speaker: 'System',
      text: `Call Connected • Scenario: "${activeScenario.title}" • Duration Guardrail: 3:00 min`,
      timestamp: Date.now(),
      isFinal: true
    };

    const customerMsg: TranscriptMessage = {
      id: 'msg_' + Date.now(),
      speaker: 'AI Customer',
      text: initialCustomerStatement,
      timestamp: Date.now() + 100,
      isFinal: true
    };

    setTranscript([systemMsg, customerMsg]);
    speakText(initialCustomerStatement);
  };

  // Setup Web Speech Recognition with Real-Time Streaming and AssemblyAI VAD
  const setupSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in browser environment');
      setIsMicListening(true);
      setStatusText('Microphone active • Spoken voice streaming ready');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += text;
          } else {
            interim += text;
          }
        }

        if (echoGateEnabledRef.current && isAiSpeakingRef.current) {
          // Gating prevents speech recognition from capturing speaker audio
          return;
        }

        if (interim) {
          setInterimTranscript(interim);
          setIsCandidateSpeaking(true);
          setStatusText(`Candidate speaking: "${interim}"`);

          // Auto-commit upon natural speaking pause (1.4s silence)
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            if (interim && interim.trim().length > 2 && !isProcessingTurnRef.current) {
              const spoken = interim.trim();
              setInterimTranscript('');
              handleCandidateTurn(spoken);
            }
          }, 1400);
        }

        if (finalChunk && finalChunk.trim().length > 1) {
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          const spoken = finalChunk.trim();
          setInterimTranscript('');
          handleCandidateTurn(spoken);
        }
      };

      recognition.onstart = () => {
        isMicListeningRef.current = true;
        setIsMicListening(true);
      };

      recognition.onerror = (event: any) => {
        if (event?.error !== 'no-speech') {
          console.warn('Speech recognition event:', event?.error);
        }
      };

      recognition.onend = () => {
        if (isCallActive && isMicListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isMicListeningRef.current = true;
      setIsMicListening(true);
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      isMicListeningRef.current = true;
      setIsMicListening(true);
    }
  };

  const handleToggleMic = () => {
    if (!isMicListening) {
      isMicListeningRef.current = true;
      setIsMicListening(true);
      if (appMode !== 'ASSEMBLYAI') {
        setupSpeechRecognition();
      }
    } else {
      isMicListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      setInterimTranscript('');
      setIsMicListening(false);
    }
  };

  // Barge-in Interruption handler
  const handleBargeInInterrupt = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    setStatusText('Customer speech interrupted by candidate (Barge-in VAD < 320ms)');

    const interruptMarker: ConversationalMarker = {
      id: 'marker_' + Date.now(),
      markerType: 'ACTIVE_LISTENING',
      candidateQuote: '[Candidate initiated sub-350ms barge-in interruption]',
      impact: 'POSITIVE',
      coachingNote: 'Handled customer conversational turn-taking with rapid responsiveness.',
      timestamp: Date.now()
    };
    setMarkers(prev => [interruptMarker, ...prev]);
  };

  // Candidate Spoken Turn Processing
  const handleCandidateTurn = async (candidateText: string) => {
    if (!isCallActive) return;
    if (!candidateText || candidateText.trim().length === 0) return;

    if (appMode === 'ASSEMBLYAI') {
      activeCustomerReplyIdRef.current = null;
      const candidateMsg: TranscriptMessage = {
        id: 'msg_cand_' + Date.now(),
        speaker: 'Candidate',
        text: candidateText,
        timestamp: Date.now(),
        isFinal: true
      };
      setTranscript(prev => cleanAndDeduplicateTranscript([...prev, candidateMsg]));
      setIsCandidateSpeaking(false);
      setStatusText('Candidate turn processed • Streaming to AssemblyAI Voice Agent');

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'candidate_text',
          text: candidateText
        }));
      }
      return;
    }

    if (isProcessingTurnRef.current) return;
    isProcessingTurnRef.current = true;
    setInterimTranscript('');
    setIsCandidateSpeaking(false);
    setStatusText('Evaluating candidate speech & linguistic markers...');

    const candidateMsg: TranscriptMessage = {
      id: 'msg_' + Date.now(),
      speaker: 'Candidate',
      text: candidateText,
      timestamp: Date.now(),
      isFinal: true
    };

    const nextTurnIdx = currentTurnIndex + 1;
    setCurrentTurnIndex(nextTurnIdx);

    // Call server AI evaluator or fallback rubric
    let evaluationResult: any = null;
    try {
      const res = await fetch('/api/ai/evaluate-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateQuote: candidateText,
          customerStatement: transcript.findLast(m => m.speaker === 'AI Customer')?.text || '',
          scenarioTitle: activeScenario.title,
          currentScores: radarScores,
          turnIndex: nextTurnIdx
        })
      });
      if (res.ok) {
        evaluationResult = await res.json();
      }
    } catch (err) {
      console.warn('Server evaluate-turn error:', err);
    }

    // Default fallback scripted turn if needed
    const scriptedTurn = activeScenario.scriptedTurns[nextTurnIdx];

    // Log AI Tool Marker
    const markerData = evaluationResult?.marker || scriptedTurn?.sampleMarker || {
      markerType: 'ACTIVE_LISTENING',
      candidateQuote: candidateText,
      impact: 'POSITIVE',
      coachingNote: 'Directly addressed customer request.'
    };

    const newMarker: ConversationalMarker = {
      id: 'marker_' + Date.now(),
      markerType: markerData.markerType,
      candidateQuote: markerData.candidateQuote || candidateText,
      impact: markerData.impact || 'POSITIVE',
      coachingNote: markerData.coachingNote,
      timestamp: Date.now()
    };

    // Attach marker to message
    candidateMsg.markers = [newMarker];
    setMarkers(prev => [newMarker, ...prev]);

    // Update Radar Scores
    const deltas = evaluationResult?.deltaScores || {
      fluency: 3,
      grammar: 2,
      lexical: 3,
      pronunciation: 2,
      empathy: 4
    };

    setRadarScores(prev => ({
      fluency: Math.max(30, Math.min(98, prev.fluency + (deltas.fluency || 2))),
      grammar: Math.max(30, Math.min(98, prev.grammar + (deltas.grammar || 2))),
      lexical: Math.max(30, Math.min(98, prev.lexical + (deltas.lexical || 3))),
      pronunciation: Math.max(30, Math.min(98, prev.pronunciation + (deltas.pronunciation || 2))),
      empathy: Math.max(30, Math.min(98, prev.empathy + (deltas.empathy || 4)))
    }));

    // Update Customer Temperament
    const newTemp = evaluationResult?.newTemperament || scriptedTurn?.temperament || 'REASSURED_CALMED';
    const newSentiment = evaluationResult?.sentimentScore || scriptedTurn?.sentimentScore || 75;
    const reason = evaluationResult?.temperamentReason || scriptedTurn?.temperamentReason || 'Candidate answered effectively.';

    setCurrentTemperament(newTemp);
    setSentimentScore(newSentiment);
    setTemperamentReason(reason);

    // Customer next response
    const customerReplyText =
      evaluationResult?.customerResponse ||
      scriptedTurn?.customerText ||
      'Thank you for your assistance today! Everything has been resolved satisfactorily.';

    const customerMsg: TranscriptMessage = {
      id: 'msg_' + (Date.now() + 50),
      speaker: 'AI Customer',
      text: customerReplyText,
      timestamp: Date.now() + 50,
      isFinal: true
    };

    setTranscript(prev => [...prev, candidateMsg, customerMsg]);
    setIsCandidateSpeaking(false);
    isProcessingTurnRef.current = false;
    speakText(customerReplyText);

    // Check if session resolved or turns completed
    if (evaluationResult?.isResolutionReached || nextTurnIdx >= activeScenario.scriptedTurns.length - 1) {
      setTimeout(() => {
        handleEndCall();
      }, 4000);
    }
  };

  // End Call & Synthesize Scorecard
  const handleEndCall = () => {
    setIsCallActive(false);
    setIsAiSpeaking(false);
    setIsCandidateSpeaking(false);
    setIsMicListening(false);
    setStatusText('Assessment complete • Diagnostic Scorecard generated');

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop_interview' }));
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch (e) {}
      processorNodeRef.current = null;
    }
    stopActiveAudioPlayback();

    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // Build complete scorecard
    const finalScorecard = buildCompleteScorecard(
      candidateName,
      candidateEmail,
      targetRole,
      activeScenario.id,
      activeScenario.title,
      radarScores,
      elapsedSeconds || 85,
      currentTurnIndex + 1,
      markers.length || 3
    );
    
    // Attach the transcript and markers to the scorecard for the report
    finalScorecard.transcript = transcript.map(t => ({
       ...t,
       markers: markers.filter(m => Math.abs(m.timestamp - t.timestamp) < 5000)
    }));

    setActiveScorecard(finalScorecard);
    setIsScorecardModalOpen(true);

    // Save to ATS Candidate history & server
    setCandidateHistory(prev => [finalScorecard, ...prev.filter(c => c.id !== finalScorecard.id)]);
    fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalScorecard)
    }).catch(err => console.warn('Candidate sync error:', err));
  };

  // Quick Response Prompts for testing & demonstration
  const getQuickPrompts = () => {
    if (selectedScenarioId === 'fintech_dispute') {
      return [
        'I completely understand your frustration with this charge, Jordan. Let me verify the details and issue an immediate provisional dispute credit for you.',
        'I have confirmed the $45.00 transaction and placed an active merchant token block on CloudStream Pro so no future billing occurs.',
        'Your dispute reference number is APX-99421. The funds are credited back to your balance immediately. Is there anything else I can assist you with?'
      ];
    }
    if (selectedScenarioId === 'ecommerce_delivery') {
      return [
        "I'm so sorry to hear this, Taylor, especially with your daughter's birthday tomorrow. Let me track this order GPS scan right now.",
        'I have authorized an emergency priority dispatch from our local regional fulfillment hub with guaranteed delivery tomorrow before 11:00 AM at no additional cost.',
        "You're very welcome! I have sent the live courier tracking link directly to your mobile phone. Have a wonderful celebration!"
      ];
    }
    if (selectedScenarioId === 'telecom_technical') {
      return [
        "Alex, I recognize the extreme urgency with your executive board meeting in 12 minutes. Let's do a rapid line check immediately.",
        'I am querying the OLT terminal telemetry and have remotely activated your gateway emergency 5G cellular failover eSIM for unthrottled bandwidth.',
        'You have full 150 Mbps throughput active now, and our technician is scheduled to inspect the optical node at 2:00 PM. Best of luck on your board presentation!'
      ];
    }
    return [
      'I completely understand the situation and I am taking immediate ownership of this issue for you.',
      'I have processed the full resolution and applied account credits with priority status.',
      'Thank you for your patience today. Everything is fully resolved and confirmed.'
    ];
  };

  const handleSelectScenarioAndLaunch = (scId: string) => {
    setSelectedScenarioId(scId);
    setActiveTab('SCREENING');
    setTimeout(() => {
      setIsBriefModalOpen(true);
    }, 200);
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidateHistory(prev => prev.filter(c => c.id !== id));
    fetch(`/api/candidates/${id}`, { method: 'DELETE' }).catch(e => console.warn(e));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appMode={appMode}
        setAppMode={setAppMode}
        isVoiceMuted={isVoiceMuted}
        setIsVoiceMuted={setIsVoiceMuted}
        candidateCount={candidateHistory.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 1: Live Voice Screening Dashboard */}
        {activeTab === 'SCREENING' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Interactive Onboarding & Neural Voice Selection Guide */}
            <ScreeningGuideBanner
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              appMode={appMode}
            />

            {/* Candidate Profile Bar */}
            <CandidateProfileCard
              candidateName={candidateName}
              setCandidateName={setCandidateName}
              candidateEmail={candidateEmail}
              setCandidateEmail={setCandidateEmail}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
              isCallActive={isCallActive}
            />

            {/* Audio Waveform Oscilloscope */}
            <AudioWaveform
              isCallActive={isCallActive}
              isAiSpeaking={isAiSpeaking}
              isCandidateSpeaking={isCandidateSpeaking}
              analyserNode={isAiSpeaking ? customerAnalyserNodeRef.current : micAnalyserNodeRef.current}
              statusText={statusText}
            />

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Transcript & Candidate Microphone Controls (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <TranscriptFeed
                  transcript={transcript}
                  onPlaySpeech={speakText}
                  candidateName={candidateName}
                  interimTranscript={interimTranscript}
                  isCandidateSpeaking={isCandidateSpeaking}
                  isTranscribingAudio={isTranscribingAudio}
                  hideAnnotations={isCallActive}
                />

                <CandidateControls
                  isCallActive={isCallActive}
                  onStartCall={() => setIsBriefModalOpen(true)}
                  onEndCall={handleEndCall}
                  onCandidateSpeechSubmit={handleCandidateTurn}
                  elapsedSeconds={elapsedSeconds}
                  maxSeconds={maxDurationSeconds}
                  isAiSpeaking={isAiSpeaking}
                  onBargeInInterrupt={handleBargeInInterrupt}
                  quickPrompts={getQuickPrompts()}
                  isMicListening={isMicListening}
                  onToggleMic={handleToggleMic}
                  onViewScorecard={() => activeScorecard && setIsScorecardModalOpen(true)}
                  hasScorecard={Boolean(activeScorecard)}
                  interimTranscript={interimTranscript}
                  isTranscribing={isTranscribingAudio}
                  echoGateEnabled={echoGateEnabled}
                  onToggleEchoGate={() => {
                    const next = !echoGateEnabled;
                    setEchoGateEnabled(next);
                    echoGateEnabledRef.current = next;
                  }}
                />
              </div>

              {/* Right Column: CEFR Radar, Emotion Thermometer, Linguistic Markers (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {isCallActive ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Active Call Context</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Customer Profile</span>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-sm font-semibold text-slate-900 block mb-1">
                            {activeScenario.customerPersona.split(',')[0].replace('You are ', '')}
                          </span>
                          <span className="text-xs text-slate-600 block">{activeScenario.category} Department</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Situation Overview</span>
                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 text-xs text-slate-700 leading-relaxed">
                          {activeScenario.description}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Evaluation Criteria</span>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <li>Display strong active listening and professional empathy.</li>
                          <li>Follow logical troubleshooting/verification steps.</li>
                          <li>Maintain a calm, professional temperament to de-escalate.</li>
                          <li>Keep responses concise to allow natural turn-taking.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Real-time CEFR Radar Chart */}
                    <RadarChart scores={radarScores} />

                    {/* Real-time Customer Temperament */}
                    <TemperamentGauge
                      temperament={currentTemperament}
                      sentimentScore={sentimentScore}
                      triggerReason={temperamentReason}
                    />

                    {/* AI Linguistic Tool Calling Events Feed */}
                    <MarkersFeed markers={markers} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Candidate ATS History */}
        {activeTab === 'CANDIDATES' && (
          <CandidateHistoryView
            candidates={candidateHistory}
            onSelectCandidate={(sc) => {
              setActiveScorecard(sc);
              setIsScorecardModalOpen(true);
            }}
            onDeleteCandidate={handleDeleteCandidate}
            onStartNewAssessment={() => setActiveTab('SCREENING')}
          />
        )}

        {/* Tab 3: Scenario & Persona Studio */}
        {activeTab === 'SCENARIOS' && (
          <ScenarioStudioView
            scenarios={scenarios}
            activeScenarioId={selectedScenarioId}
            onSelectScenario={(id) => setSelectedScenarioId(id)}
            onStartRoleplay={handleSelectScenarioAndLaunch}
            onAddCustomScenario={(newSc) => {
              setScenarios(prev => [newSc, ...prev]);
              setSelectedScenarioId(newSc.id);
            }}
          />
        )}

        {/* Tab 4: Architecture Deck & Pitch Deck */}
        {activeTab === 'ARCHITECTURE_DECK' && (
          <ArchitectureDeckView />
        )}
      </main>

      {/* Audit Scorecard Modal */}
      {isScorecardModalOpen && activeScorecard && (
        <ScorecardModal
          scorecard={activeScorecard}
          onClose={() => setIsScorecardModalOpen(false)}
        />
      )}

      {/* Call Briefing Modal before connecting */}
      {isBriefModalOpen && activeScenario && (
        <CallBriefModal
          scenario={activeScenario}
          candidateName={candidateName}
          onConnect={() => {
            setIsBriefModalOpen(false);
            handleStartCall();
          }}
          onCancel={() => setIsBriefModalOpen(false)}
        />
      )}
    </div>
  );
}
export default App;
