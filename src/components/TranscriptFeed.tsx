// Live dialogue feed for the roleplay call, fed by Voice Agent transcript events.
import React, { useEffect, useRef } from 'react';
import { Bot, MessageSquare, Mic, User } from 'lucide-react';
import type { LiveLine } from '../lib/liveTranscript';

interface TranscriptFeedProps {
  lines: LiveLine[];
  interim: string;
  candidateName: string;
  customerName: string;
}

export const TranscriptFeed: React.FC<TranscriptFeedProps> = ({ lines, interim, candidateName, customerName }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, interim]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col flex-1 min-h-[380px] shadow-2xs">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">Live Call Transcript</h3>
        <span className="ml-auto text-[10px] text-slate-400 font-mono">AssemblyAI Voice Agent</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[420px] text-xs">
        {lines.length === 0 && !interim && (
          <div className="text-center text-slate-400 py-20 flex flex-col items-center gap-2">
            <Bot className="w-8 h-8 text-slate-300" />
            <p>Start the call. The customer speaks first; answer out loud as the support agent.</p>
          </div>
        )}

        {lines.map(line => {
          const isCustomer = line.speaker === 'Customer';
          return (
            <div key={line.id} className={`flex gap-2.5 items-start ${isCustomer ? '' : 'flex-row-reverse'}`}>
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isCustomer ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-900 text-white'
                }`}
              >
                {isCustomer ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[85%] flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                <span className="mb-1 px-1 text-[10px] text-slate-700 font-semibold">
                  {isCustomer ? customerName : candidateName || 'Candidate'}
                </span>
                <p
                  className={`p-3 rounded-lg leading-relaxed ${
                    isCustomer ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-slate-900 text-white'
                  } ${line.final ? '' : 'opacity-70'}`}
                >
                  {line.text}
                </p>
              </div>
            </div>
          );
        })}

        {interim && (
          <div className="flex gap-2.5 items-start flex-row-reverse">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-emerald-600 text-white animate-pulse">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <p className="max-w-[85%] p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-slate-900 italic">{interim}</p>
          </div>
        )}
      </div>
    </div>
  );
};
