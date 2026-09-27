// Runs one live roleplay call: mic capture, agent playback, live transcript, and the post-call scorecard.
import { useEffect, useRef, useState } from 'react';
import { addCandidateLine, appendAgentDelta, countFillers, finalizeAgentLine, type LiveLine } from '../lib/liveTranscript';
import { startMic, type MicCapture } from '../lib/micCapture';
import { PcmPlayer, SAMPLE_RATE } from '../lib/pcmPlayer';
import { openCallSocket, type CallSocket, type ServerEvent } from '../services/callService';
import type { CandidateProfile, Scenario, Scorecard } from '../types';

export type CallPhase = 'idle' | 'connecting' | 'live' | 'analyzing' | 'done' | 'error';

export function useVoiceCall(onScorecard: (sc: Scorecard) => void) {
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [lines, setLines] = useState<LiveLine[]>([]);
  const [interim, setInterim] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [candidateSpeaking, setCandidateSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [analysers, setAnalysers] = useState<{ agent: AnalyserNode | null; mic: AnalyserNode | null }>({ agent: null, mic: null });

  const socket = useRef<CallSocket | null>(null);
  const player = useRef<PcmPlayer | null>(null);
  const mic = useRef<MicCapture | null>(null);
  const ctx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const releaseAudio = () => {
    mic.current?.stop();
    mic.current = null;
    player.current?.flush();
    ctx.current?.close();
    ctx.current = null;
  };

  const handleEvent = (e: ServerEvent) => {
    switch (e.type) {
      case 'ready': return setPhase('live');
      case 'agent_reply_started': return setAgentSpeaking(true);
      case 'agent_delta': return setLines(l => appendAgentDelta(l, e.replyId, e.delta));
      case 'agent_final': return setLines(l => finalizeAgentLine(l, e.replyId, e.text || ''));
      case 'agent_reply_done':
        if (e.status === 'interrupted') player.current?.flush();
        return;
      case 'user_speech_started':
        player.current?.flush(); // snappiest barge-in, per AssemblyAI's interruption guide
        return setCandidateSpeaking(true);
      case 'user_speech_stopped': return setCandidateSpeaking(false);
      case 'user_delta': return setInterim(e.text || '');
      case 'user_final':
        setInterim('');
        setFillers(n => n + countFillers(e.text || ''));
        return setLines(l => addCandidateLine(l, e.itemId, e.text || ''));
      case 'time_limit': return setNotice('Time limit reached. Ending the call.');
      case 'analysis_started':
        releaseAudio();
        return setPhase('analyzing');
      case 'assessment':
        setPhase('done');
        socket.current?.close();
        return onScorecard(e.scorecard);
      case 'assessment_error':
      case 'agent_closed':
      case 'error':
        setError(e.message || `Voice Agent closed (${e.code}) ${e.reason || ''}`);
        if (e.type === 'assessment_error') setPhase('error');
        return;
    }
  };

  async function start(scenario: Scenario, profile: CandidateProfile) {
    setPhase('connecting');
    setLines([]);
    setInterim('');
    setElapsed(0);
    setFillers(0);
    setNotice('');
    setError('');

    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    ctx.current = audioCtx;
    player.current = new PcmPlayer(audioCtx, () => setAgentSpeaking(false));

    socket.current = openCallSocket({
      onOpen: async () => {
        try {
          mic.current = await startMic(audioCtx, pcm => socket.current?.sendAudio(pcm), () => !!player.current?.isPlaying);
          setAnalysers({ agent: player.current!.analyser, mic: mic.current.analyser });
          socket.current?.start(scenario, profile);
        } catch (err: any) {
          setError(`Microphone unavailable: ${err?.message || err}`);
          setPhase('error');
          socket.current?.close();
          releaseAudio();
        }
      },
      onEvent: handleEvent,
      onAudio: pcm => {
        setAgentSpeaking(true);
        player.current?.play(pcm);
      },
      onClose: () => setPhase(p => {
        if (p !== 'live' && p !== 'connecting' && p !== 'analyzing') return p;
        setError('Connection to the server was lost.');
        releaseAudio();
        return 'error';
      })
    });
  }

  function end() {
    socket.current?.end();
  }

  useEffect(() => () => {
    socket.current?.close();
    releaseAudio();
  }, []);

  return { phase, lines, interim, agentSpeaking, candidateSpeaking, elapsed, fillers, notice, error, analysers, start, end };
}
