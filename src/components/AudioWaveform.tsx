import React, { useEffect, useRef } from 'react';
import { Mic, Volume2, Radio } from 'lucide-react';

interface AudioWaveformProps {
  isCallActive: boolean;
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  analyserNode: AnalyserNode | null;
  statusText: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isCallActive,
  isAiSpeaking,
  isCandidateSpeaking,
  analyserNode,
  statusText
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Clean solid background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Center reference baseline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isCallActive) {
        // Idle flatline
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      if (analyserNode) {
        // Real microphone frequency data
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = isCandidateSpeaking ? '#059669' : '#2563eb';
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else {
        // Synthesized audio wave animation
        phase += 0.08;
        const amplitude = isAiSpeaking ? 14 : isCandidateSpeaking ? 18 : 2.5;
        const color = isAiSpeaking ? '#2563eb' : isCandidateSpeaking ? '#059669' : '#94a3b8';

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const freq1 = Math.sin((x * 0.035) + phase) * amplitude;
          const freq2 = Math.cos((x * 0.018) - phase * 0.5) * (amplitude * 0.4);
          const y = height / 2 + freq1 + freq2;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCallActive, isAiSpeaking, isCandidateSpeaking, analyserNode]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
      {/* Speaker State Indicator */}
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isCallActive
              ? isAiSpeaking
                ? 'bg-blue-600'
                : isCandidateSpeaking
                ? 'bg-emerald-600'
                : 'bg-emerald-500'
              : 'bg-slate-400'
          }`}
        />
        <div>
          <span className="text-xs font-semibold text-slate-900 block">
            {isCallActive
              ? isAiSpeaking
                ? 'AI Customer Speaking'
                : isCandidateSpeaking
                ? 'Candidate Speaking'
                : 'Listening • Standby'
              : 'Microphone Standby'}
          </span>
          <span className="text-[11px] text-slate-500">{statusText}</span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="flex-1 relative h-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={40}
          className="w-full h-full block"
        />
        {isCallActive && (
          <div className="absolute top-1.5 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 text-[10px] text-slate-600 font-mono shadow-2xs">
            <Radio className="w-3 h-3 text-blue-600" />
            <span>16kHz Stream</span>
          </div>
        )}
      </div>

      {/* Speaker Badges */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition ${
            isAiSpeaking
              ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Customer</span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition ${
            isCandidateSpeaking
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Candidate</span>
        </div>
      </div>
    </div>
  );
};

