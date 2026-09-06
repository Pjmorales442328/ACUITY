import React, { useEffect, useRef, useMemo } from 'react';
import { MessageSquare, Volume2, Bot, User, CheckCircle2, AlertCircle, Mic, Loader2 } from 'lucide-react';
import { TranscriptMessage } from '../types';
import { cleanAndDeduplicateTranscript } from '../utils/transcriptDeduplicator';

interface TranscriptFeedProps {
  transcript: TranscriptMessage[];
  onPlaySpeech?: (text: string) => void;
  candidateName: string;
  interimTranscript?: string;
  isCandidateSpeaking?: boolean;
  isTranscribingAudio?: boolean;
  hideAnnotations?: boolean;
}

export const TranscriptFeed: React.FC<TranscriptFeedProps> = ({
  transcript,
  onPlaySpeech,
  candidateName,
  interimTranscript,
  isCandidateSpeaking,
  isTranscribingAudio,
  hideAnnotations
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const displayTranscript = useMemo(() => {
    return cleanAndDeduplicateTranscript(transcript);
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayTranscript, interimTranscript, isTranscribingAudio]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col flex-1 min-h-[380px] shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">Roleplay Live Dialogue Stream</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Bi-Directional Audio & VAD Log
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[420px] text-xs">
        {displayTranscript.length === 0 ? (
          <div className="text-center text-slate-400 py-20 text-xs flex flex-col items-center gap-2">
            <Bot className="w-8 h-8 text-slate-300" />
            <p>
              Click <span className="font-semibold text-slate-700">"Start Assessment Call"</span> below to initiate candidate roleplay.
            </p>
          </div>
        ) : (
          displayTranscript.map((msg) => {
            const isCustomer = msg.speaker === 'AI Customer';
            const isSystem = msg.speaker === 'System';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center py-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${
                  isCustomer ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium shrink-0 ${
                    isCustomer
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'bg-slate-900 border border-slate-800 text-white'
                  }`}
                >
                  {isCustomer ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Container */}
                <div className={`max-w-[85%] flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                  {/* Name & Timestamp */}
                  <div className="flex items-center gap-2 mb-1 text-[10px] px-1 text-slate-500 font-medium">
                    <span className="text-slate-700 font-semibold">
                      {isCustomer ? 'Customer Persona' : candidateName || 'Candidate'}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isCustomer
                        ? 'bg-slate-100 border border-slate-200 text-slate-800'
                        : 'bg-slate-900 text-white shadow-2xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Replay Audio TTS */}
                    {isCustomer && onPlaySpeech && (
                      <button
                        onClick={() => onPlaySpeech(msg.text)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition font-medium cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay audio</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Markers Attached to this Turn */}
                  {!hideAnnotations && msg.markers && msg.markers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 px-0.5">
                      {msg.markers.map(m => (
                        <span
                          key={m.id}
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${
                            m.impact === 'POSITIVE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          {m.impact === 'POSITIVE' ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                          )}
                          <span>{m.markerType.replace(/_/g, ' ')}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live Interim Candidate Speech Bubble */}
        {interimTranscript && (
          <div className="flex gap-2.5 items-start flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium shrink-0 bg-emerald-600 text-white shadow-xs animate-pulse">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[85%] flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] px-1 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{candidateName || 'Candidate'} (Speaking live...)</span>
              </div>
              <div className="p-3 rounded-lg text-xs leading-relaxed bg-emerald-50 border border-emerald-300 text-slate-900 shadow-xs">
                <p className="italic font-medium">"{interimTranscript}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Audio STT Transcribing in Progress Indicator */}
        {isTranscribingAudio && !interimTranscript && (
          <div className="flex gap-2.5 items-start flex-row-reverse animate-in fade-in duration-150">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium shrink-0 bg-slate-900 text-white">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            </div>
            <div className="max-w-[85%] flex flex-col items-end">
              <div className="p-2.5 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-2 font-mono text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin text-slate-700" />
                <span>Transcribing candidate audio stream (STT)...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

