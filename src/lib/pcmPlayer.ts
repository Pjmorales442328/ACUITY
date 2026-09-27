// Plays streamed 24 kHz PCM16 audio from the Voice Agent gaplessly, with an instant flush for barge-in.
export const SAMPLE_RATE = 24000;

export class PcmPlayer {
  readonly analyser: AnalyserNode;
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor(private ctx: AudioContext, private onIdle: () => void) {
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(ctx.destination);
  }

  get isPlaying() {
    return this.sources.size > 0;
  }

  play(pcm: ArrayBuffer) {
    const int16 = new Int16Array(pcm);
    const buffer = this.ctx.createBuffer(1, int16.length, SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / 32768;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);
    const startAt = Math.max(this.ctx.currentTime, this.nextTime);
    source.start(startAt);
    this.nextTime = startAt + buffer.duration;
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      if (!this.sources.size) this.onIdle();
    };
  }

  flush() {
    this.sources.forEach(s => {
      s.onended = null;
      s.stop();
    });
    this.sources.clear();
    this.nextTime = this.ctx.currentTime;
    this.onIdle();
  }
}
