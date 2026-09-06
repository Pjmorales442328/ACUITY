import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { ConversationalMarker, MarkerType } from '../types';

interface MarkersFeedProps {
  markers: ConversationalMarker[];
}

export const MarkersFeed: React.FC<MarkersFeedProps> = ({ markers }) => {
  const getMarkerBadge = (type: MarkerType, impact: string) => {
    const isPositive = impact === 'POSITIVE';
    const isNegative = impact === 'NEGATIVE';

    return {
      bg: isPositive
        ? 'bg-emerald-50/40 border-emerald-200'
        : isNegative
        ? 'bg-rose-50/40 border-rose-200'
        : 'bg-slate-50 border-slate-200',
      pill: isPositive
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : isNegative
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : 'bg-slate-100 text-slate-700 border-slate-200',
      icon: isPositive ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : isNegative ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      )
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-2xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">Linguistic & Behavioral Event Stream</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
          {markers.length} {markers.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 text-xs">
        {markers.length === 0 ? (
          <div className="text-slate-400 text-center py-6 italic text-xs">
            Linguistic markers, grammar events, and empathy flags logged by real-time analysis stream here.
          </div>
        ) : (
          markers.map(m => {
            const style = getMarkerBadge(m.markerType, m.impact);
            return (
              <div
                key={m.id}
                className={`p-2.5 rounded-lg border text-xs ${style.bg}`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-900">
                    {style.icon}
                    <span>{m.markerType.replace(/_/g, ' ')}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${style.pill}`}>
                    {m.impact}
                  </span>
                </div>
                {m.candidateQuote && (
                  <div className="flex items-start gap-1 text-slate-800 text-xs italic my-1 pl-1.5 border-l-2 border-blue-600">
                    <span>"{m.candidateQuote}"</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-600 leading-snug">
                  {m.coachingNote}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

