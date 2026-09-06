import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  Sparkles
} from 'lucide-react';
import { Scenario } from '../types';

interface ScenarioStudioViewProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onStartRoleplay: (scenarioId: string) => void;
  onAddCustomScenario: (sc: Scenario) => void;
}

export const ScenarioStudioView: React.FC<ScenarioStudioViewProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onStartRoleplay,
  onAddCustomScenario
}) => {
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'Fintech' | 'E-Commerce' | 'Telecom' | 'Hospitality' | 'Healthcare' | 'Custom'>('Custom');
  const [customDifficulty, setCustomDifficulty] = useState('Intermediate');
  const [customPersona, setCustomPersona] = useState('');
  const [customInitialTurn, setCustomInitialTurn] = useState('');

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customPersona.trim() || !customInitialTurn.trim()) return;

    const newScenario: Scenario = {
      id: 'custom_' + Date.now(),
      title: customTitle.trim(),
      description: customPersona.slice(0, 140) + '...',
      difficulty: customDifficulty,
      category: customCategory,
      customerPersona: customPersona.trim(),
      initialSentiment: 25,
      initialTemperament: 'AGITATED_ANXIOUS',
      scriptedTurns: [
        {
          customerText: customInitialTurn.trim(),
          expectedCandidateTopic: 'Warm greeting, immediate empathy, and professional inquiry',
          sentimentScore: 25,
          temperament: 'AGITATED_ANXIOUS',
          temperamentReason: 'Customer initiated contact seeking resolution.',
          sampleMarker: {
            markerType: 'EMPATHY_DEMONSTRATED',
            candidateQuote: 'I completely understand your frustration and I will take care of this right away.',
            impact: 'POSITIVE',
            coachingNote: 'Prompt, validating opening.'
          }
        },
        {
          customerText: 'Thank you for acknowledging that. What specific steps are you going to take right now?',
          expectedCandidateTopic: 'Direct action plan and timeline commitment',
          sentimentScore: 55,
          temperament: 'NEUTRAL_ATTENTIVE',
          temperamentReason: 'Candidate gave reassurance and initiated troubleshooting.'
        },
        {
          customerText: 'Great! As long as you confirm that is taken care of, I am completely satisfied.',
          expectedCandidateTopic: 'Reference number, confirmation, and professional closing',
          sentimentScore: 92,
          temperament: 'SATISFIED_GRATEFUL',
          temperamentReason: 'Candidate resolved customer inquiry with high empathy.'
        }
      ]
    };

    onAddCustomScenario(newScenario);
    setIsCreatingCustom(false);
    setCustomTitle('');
    setCustomPersona('');
    setCustomInitialTurn('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Roleplay Scenario Library & Persona Studio
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Pre-configured contact center friction scenarios with automated speech tool schemas.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCustom(!isCreatingCustom)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Scenario</span>
        </button>
      </div>

      {/* Custom Scenario Builder Card */}
      {isCreatingCustom && (
        <form onSubmit={handleCreateCustom} className="bg-white border border-slate-300 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Define Custom Roleplay Persona</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingCustom(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Scenario Title</label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Flight Rebooking"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Domain Category</label>
              <select
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="Fintech">Fintech</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Telecom">Telecom</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Custom">Custom Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Difficulty</label>
              <input
                type="text"
                value={customDifficulty}
                onChange={e => setCustomDifficulty(e.target.value)}
                placeholder="e.g. Advanced"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Customer Persona System Prompt</label>
            <textarea
              required
              rows={2}
              value={customPersona}
              onChange={e => setCustomPersona(e.target.value)}
              placeholder="Describe the customer emotional state and problem..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Opening Turn Statement</label>
            <input
              type="text"
              required
              value={customInitialTurn}
              onChange={e => setCustomInitialTurn(e.target.value)}
              placeholder="e.g. Hello! I have been waiting for hours and need immediate resolution."
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingCustom(false)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white cursor-pointer shadow-xs"
            >
              Save & Activate
            </button>
          </div>
        </form>
      )}

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map(sc => {
          const isSelected = sc.id === activeScenarioId;

          return (
            <div
              key={sc.id}
              className={`bg-white border rounded-xl p-4 transition-all shadow-2xs flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 ring-1 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {sc.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 font-mono">
                    {sc.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {sc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {sc.description}
                </p>

                {/* Persona Preview Box */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Customer Persona Context
                  </span>
                  <p className="text-[11px] text-slate-700 italic line-clamp-2">
                    "{sc.customerPersona}"
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectScenario(sc.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {isSelected ? '✓ Selected Active' : 'Select Scenario'}
                </button>

                <button
                  onClick={() => onStartRoleplay(sc.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Live Screening</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

