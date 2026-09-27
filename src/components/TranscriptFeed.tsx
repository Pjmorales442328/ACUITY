import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MessageSquare, Volume2, Bot, User, CheckCircle2, AlertCircle, Mic, Loader2, Copy, Check, Download } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const displayTranscript = useMemo(() => {
    return cleanAndDeduplicateTranscript(transcript);
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayTranscript, interimTranscript, isTranscribingAudio]);

  const handleCopyAll = () => {
    if (displayTranscript.length === 0) return;
    let txt = `AcuityVoice Roleplay Transcript\nCandidate: ${candidateName}\nTimestamp: ${new Date().toLocaleString()}\n\n`;
    displayTranscript.forEach(msg => {
      txt += `[${msg.speaker}] ${msg.text}\n`;
    });
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportTxt = () => {
    if (displayTranscript.length === 0) return;
    let txt = `AcuityVoice Roleplay Transcript\nCandidate: ${candidateName}\nTimestamp: ${new Date().toLocaleString()}\n\n`;
    displayTranscript.forEach(msg => {
      txt += `[${msg.speaker} - ${new Date(msg.timestamp).toISOString().split('T')[1].slice(0, 8)}]\n`;
      txt += `${msg.text}\n\n`;
    });
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `transcript_${candidateName.replace(/\s+/g, '_')}_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col flex-1 min-h-[380px] shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">Roleplay Live Dialogue Stream</h3>
        </div>
        <div className="flex items-center gap-2">
          {displayTranscript.length > 0 && (
            <>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition cursor-pointer"
                title="Copy entire transcript to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleExportTxt}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition cursor-pointer"
                title="Download transcript as text file"
              >
                <Download className="w-3 h-3" />
                <span>Export TXT</span>
              </button>
            </>
          )}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Bi-Directional Audio & VAD Log
          </span>
        </div>
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

