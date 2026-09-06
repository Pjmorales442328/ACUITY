import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Zap,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface CandidateControlsProps {
  isCallActive: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onCandidateSpeechSubmit: (text: string) => void;
  elapsedSeconds: number;
  maxSeconds: number;
  isAiSpeaking: boolean;
  onBargeInInterrupt: () => void;
  quickPrompts: string[];
  isMicListening: boolean;
  onToggleMic: () => void;
  onViewScorecard: () => void;
  hasScorecard: boolean;
  interimTranscript?: string;
  isTranscribing?: boolean;
  echoGateEnabled?: boolean;
  onToggleEchoGate?: () => void;
}

export const CandidateControls: React.FC<CandidateControlsProps> = ({
  isCallActive,
  onStartCall,
  onEndCall,
  onCandidateSpeechSubmit,
  elapsedSeconds,
  maxSeconds,
  isAiSpeaking,
  onBargeInInterrupt,
  quickPrompts,
  isMicListening,
  onToggleMic,
  onViewScorecard,
  hasScorecard,
  interimTranscript,
  isTranscribing,
  echoGateEnabled = true,
  onToggleEchoGate
}) => {
  const [inputText, setInputText] = useState('');

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onCandidateSpeechSubmit(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const timePercent = Math.min(100, (elapsedSeconds / maxSeconds) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
      {/* Top Bar: Call Action + Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Call Start/Stop Buttons */}
        <div className="flex items-center gap-2">
          {!isCallActive ? (
            <button
              onClick={onStartCall}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Start Assessment Call</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onEndCall}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Conclude & Score</span>
              </button>

              {/* Barge-in Button */}
              {isAiSpeaking && (
                <button
                  onClick={onBargeInInterrupt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold text-xs transition cursor-pointer"
                  title="Interrupt customer speech (sub-350ms turn taking)"
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Barge-in</span>
                </button>
              )}
            </div>
          )}

          {hasScorecard && !isCallActive && (
            <button
              onClick={onViewScorecard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-300 shadow-2xs cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspect CEFR Scorecard</span>
            </button>
          )}
        </div>

        {/* Live Call Duration & AssemblyAI Credit Guardrail Timer */}
        {isCallActive && (
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="font-mono text-slate-900 font-semibold text-xs">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <span className="text-slate-400">/</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>Credit Cap: {formatTime(maxSeconds)}</span>
            </div>
            {/* Visual Mini Progress Bar */}
            <div className="w-10 bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  timePercent > 80 ? 'bg-rose-600' : timePercent > 50 ? 'bg-amber-500' : 'bg-slate-900'
                }`}
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Responses / Candidate Coaching suggestions */}
      {isCallActive && quickPrompts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-700 font-semibold">
              Candidate Response Templates:
            </span>
            <span className="text-[10px] text-slate-400">
              Click template or speak directly
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onCandidateSpeechSubmit(prompt)}
                className="text-left text-xs bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 p-2.5 rounded-lg transition leading-relaxed cursor-pointer"
                title={prompt}
              >
                <span className="text-slate-400 font-mono text-[10px] mr-1.5">{idx + 1}.</span>
                <span>"{prompt}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input: Live Mic + Spoken/Typed Answer */}
      {isCallActive && (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          {/* Live Mic Toggle */}
          <button
            onClick={onToggleMic}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isMicListening
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
            }`}
            title={isMicListening ? 'Microphone Active (Transmitting...)' : 'Enable Live Microphone Input'}
          >
            {isMicListening ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px]">{isMicListening ? 'Mic ON' : 'Mic Muted'}</span>
          </button>

          {/* Echo Gate Anti-Feedback Toggle */}
          {onToggleEchoGate && (
            <button
              onClick={onToggleEchoGate}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                echoGateEnabled
                  ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-2xs'
              }`}
              title={
                echoGateEnabled
                  ? 'Echo Shield Active: Prevents customer voice from leaking back into mic and looping'
                  : 'Headset Mode: Full-duplex audio without speaker echo gating'
              }
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${echoGateEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[11px]">{echoGateEnabled ? 'Echo Shield' : 'Headset Mode'}</span>
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isMicListening
                ? (interimTranscript ? `Speaking: "${interimTranscript}"...` : 'Mic active • Speak now or type candidate response...')
                : 'Type candidate spoken reply and hit Enter...'
            }
            className="flex-1 bg-transparent px-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Submit */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Mic Voice Activity Banner / Echo Shield Banner */}
      {isCallActive && isAiSpeaking && echoGateEnabled && (
        <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50/90 border border-blue-200/90 rounded-md text-[11px] text-blue-900 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-semibold">Feedback Shield Active:</span>
            <span className="text-blue-700">Gating speaker output to prevent customer voice looping</span>
          </div>
          <span className="text-[10px] font-mono text-blue-600 hidden sm:inline">
            Loop Prevention Engaged
          </span>
        </div>
      )}

      {isCallActive && isMicListening && (!isAiSpeaking || !echoGateEnabled) && (
        <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-[11px] text-emerald-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold">Microphone VAD Active:</span>
            <span className="text-slate-600">
              {interimTranscript ? (
                <span className="italic font-medium text-emerald-900">"{interimTranscript}"</span>
              ) : isTranscribing ? (
                <span className="italic text-slate-500">Transcribing speech chunk...</span>
              ) : (
                'Listening for speech (speak naturally)...'
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 hidden sm:inline">
            Latency &lt; 320ms
          </span>
        </div>
      )}
    </div>
  );
};

