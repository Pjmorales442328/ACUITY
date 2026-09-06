import React from 'react';
import { HeartPulse, Smile, Meh, Frown, Flame } from 'lucide-react';
import { TemperamentType } from '../types';

interface TemperamentGaugeProps {
  temperament: TemperamentType;
  sentimentScore: number;
  triggerReason: string;
}

export const TemperamentGauge: React.FC<TemperamentGaugeProps> = ({
  temperament,
  sentimentScore,
  triggerReason
}) => {
  const getBadgeStyle = () => {
    if (sentimentScore >= 75) {
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <Smile className="w-3.5 h-3.5 text-emerald-600" />,
        label: 'CALMED / SATISFIED'
      };
    }
    if (sentimentScore >= 45) {
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Meh className="w-3.5 h-3.5 text-amber-600" />,
        label: 'NEUTRAL ATTENTIVE'
      };
    }
    return {
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: <Frown className="w-3.5 h-3.5 text-rose-600" />,
      label: 'AGITATED / ANXIOUS'
    };
  };

  const style = getBadgeStyle();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">Customer Sentiment & De-escalation</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${style.badge}`}>
          {style.icon}
          <span>{temperament.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Progress Thermometer */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 relative mb-1.5">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${Math.max(6, Math.min(100, sentimentScore))}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
        <span className="text-rose-600 font-medium">0% Escalated</span>
        <span>50% Neutral</span>
        <span className="text-emerald-600 font-medium">100% Calmed</span>
      </div>

      <div className="mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
          Sentiment State Analysis
        </span>
        <p className="text-xs text-slate-700 italic line-clamp-2">
          "{triggerReason || 'Customer is evaluating candidate responsiveness and problem-solving clarity.'}"
        </p>
      </div>
    </div>
  );
};

