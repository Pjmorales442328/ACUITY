// Call controls: start/end, timer, live speaking signals, analysis progress and errors.
import React from 'react';
import { AlertTriangle, Award, Bot, Headphones, Loader2, Phone, PhoneOff } from 'lucide-react';
import type { CallPhase } from '../hooks/useVoiceCall';
import type { DemoRepStyle } from '../types';

interface CandidateControlsProps {
  phase: CallPhase;
  elapsed: number;
  maxSeconds: number;
  candidateTurns: number;
  fillers: number;
  notice: string;
  error: string;
  hasScorecard: boolean;
  demo: boolean;
  onStart: () => void;
  onEnd: () => void;
  onDemo: (style: DemoRepStyle) => void;
  onViewScorecard: () => void;
}

const DEMO_REPS: [DemoRepStyle, string][] = [['strong', 'Strong candidate'], ['trainee', 'New hire']];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const CandidateControls: React.FC<CandidateControlsProps> = props => {
  const { phase, elapsed, maxSeconds, candidateTurns, fillers, notice, error, hasScorecard, demo } = props;
  const inCall = phase === 'connecting' || phase === 'live';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {inCall ? (
          <button
            onClick={props.onEnd}
            disabled={phase === 'connecting'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" /> End call &amp; assess
          </button>
        ) : (
          <button
            onClick={props.onStart}
            disabled={phase === 'analyzing'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
          >
            <Phone className="w-4 h-4" /> Start assessment call
          </button>
        )}

        {!inCall && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Bot className="w-4 h-4 text-violet-600" /> AI demo call:
            {DEMO_REPS.map(([style, label]) => (
              <button
                key={style}
                onClick={() => props.onDemo(style)}
                disabled={phase === 'analyzing'}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-semibold cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {phase === 'connecting' && <span className="text-xs text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Connecting to the customer...</span>}

        {phase === 'live' && (
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="font-mono font-semibold text-slate-900">{mmss(elapsed)} / {mmss(maxSeconds)}</span>
            <span>{demo ? 'Rep turns' : 'Your turns'}: <b className="text-slate-900">{candidateTurns}</b></span>
            <span>Filler words: <b className={fillers > 3 ? 'text-amber-600' : 'text-slate-900'}>{fillers}</b></span>
          </div>
        )}

        {hasScorecard && !inCall && phase !== 'analyzing' && (
          <button
            onClick={props.onViewScorecard}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-blue-600" /> View latest scorecard
          </button>
        )}
      </div>

      {demo && inCall && (
        <p className="flex items-center gap-2 text-xs text-violet-800 bg-violet-50 border border-violet-200 p-2.5 rounded-lg">
          <Bot className="w-4 h-4 shrink-0" /> Demo call: both sides are AssemblyAI Voice Agents. An AI rep is handling the AI customer, and it gets scored exactly like a human candidate.
        </p>
      )}

      {phase === 'analyzing' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          <span>Assessing the call: transcribing the rep's audio with Universal-3.5 Pro, measuring pace and fillers, then scoring with the evaluator agent. This takes about 10-20 seconds.</span>
        </div>
      )}

      {notice && <p className="text-xs text-amber-700">{notice}</p>}
      {error && (
        <p className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      {phase === 'idle' && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Headphones className="w-3.5 h-3.5" /> Headphones recommended so the customer doesn't hear itself.
        </p>
      )}
    </div>
  );
};
