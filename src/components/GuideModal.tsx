// Short "how it works" guide shown from the screening page.
import React from 'react';
import { X } from 'lucide-react';

const STEPS = [
  ['Pick a scenario', 'Choose a customer situation and enter the candidate\'s details.'],
  ['Take the call', 'The AssemblyAI Voice Agent plays an upset customer. Speak naturally; you can interrupt, and the customer reacts to how you handle them.'],
  ['End the call', 'Your recorded answers are transcribed with Universal-3.5 Pro, keeping filler words and word timings.'],
  ['Get the scorecard', 'An evaluator agent scores five rubric dimensions. Every finding quotes your exact words, and the quote is verified against the transcript.']
];

export const GuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="How it works" className="bg-white text-slate-900 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">How an AcuityVoice screening works</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <ol className="space-y-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-slate-500">Use headphones so the customer's voice doesn't leak into your microphone. Calls are capped at 5 minutes.</p>
      </div>
    </div>
  );
};
