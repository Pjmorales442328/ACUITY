// Captures the microphone as a continuous 24 kHz PCM16 stream for the Voice Agent.
const FRAME_SIZE = 2048; // ~85 ms at 24 kHz, inside AssemblyAI's 50-1000 ms chunk guidance
// While the customer is talking, quiet input is most likely speaker bleed; loud input is a real barge-in.
const ECHO_GATE_RMS = 0.045;

export interface MicCapture {
  analyser: AnalyserNode;
  stop: () => void;
}

export async function startMic(
  ctx: AudioContext,
  onFrame: (pcm: ArrayBuffer) => void,
  isAgentSpeaking: () => boolean
): Promise<MicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  });
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  // ponytail: ScriptProcessorNode is deprecated but universally supported; move to AudioWorklet if it is ever removed.
  const processor = ctx.createScriptProcessor(FRAME_SIZE, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  processor.onaudioprocess = e => {
    const input = e.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const gated = isAgentSpeaking() && Math.sqrt(sum / input.length) < ECHO_GATE_RMS;

    // Always send a frame (zeros when gated) so turn detection sees continuous audio.
    const pcm = new Int16Array(input.length);
    if (!gated) {
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }
    onFrame(pcm.buffer);
  };

  return {
    analyser,
    stop: () => {
      processor.onaudioprocess = null;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach(t => t.stop());
    }
  };
}
