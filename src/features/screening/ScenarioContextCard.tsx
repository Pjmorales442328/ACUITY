// Side panel describing the active scenario and what the candidate is assessed on.
import React from 'react';
import type { Scenario } from '../../types';

const CRITERIA = [
  ['Empathy', 'Acknowledge the customer\'s specific worry'],
  ['Ownership', 'Commit to concrete next steps'],
  ['Accuracy', 'Stay consistent; don\'t overpromise'],
  ['Clarity', 'Short, structured answers'],
  ['Language', 'Grammar, vocabulary, fluency']
];

export const ScenarioContextCard: React.FC<{ scenario: Scenario }> = ({ scenario }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scenario</h3>
      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{scenario.category}</span>
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{scenario.description}</p>
      <p className="text-[11px] text-slate-500 mt-1">Caller: <b>{scenario.customerName}</b> · voice {scenario.voice}</p>
    </div>
    {scenario.script.length > 0 && (
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Your call script</span>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
          {scenario.script.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
    )}
    <div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Scored on</span>
      <ul className="space-y-1">
        {CRITERIA.map(([name, hint]) => (
          <li key={name} className="text-xs text-slate-700"><b>{name}</b> <span className="text-slate-500">· {hint}</span></li>
        ))}
      </ul>
    </div>
  </div>
);
