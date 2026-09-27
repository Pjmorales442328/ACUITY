// Form for authoring a custom roleplay customer persona.
import React, { useState } from 'react';
import type { Scenario, ScenarioCategory, VoiceId } from '../types';

const CATEGORIES: ScenarioCategory[] = ['Fintech', 'E-Commerce', 'Telecom', 'Hospitality', 'Technical Support', 'Custom'];
const VOICES: VoiceId[] = ['jane', 'michael', 'george', 'vera', 'alba', 'anna', 'charles', 'eve', 'jean', 'mary', 'paul'];
const input = 'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900';
const label = 'text-[11px] font-semibold text-slate-600 block mb-1';

export const ScenarioForm: React.FC<{ onCreate: (s: Scenario) => void; onCancel: () => void }> = ({ onCreate, onCancel }) => {
  const [f, setF] = useState({
    title: '', category: 'Custom' as ScenarioCategory, difficulty: 'Intermediate',
    customerName: '', voice: 'jane' as VoiceId, persona: '', greeting: '', keyterms: '', script: ''
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      id: `custom_${Date.now()}`,
      title: f.title.trim(),
      description: f.persona.trim().slice(0, 160),
      difficulty: f.difficulty.trim(),
      category: f.category,
      customerName: f.customerName.trim(),
      persona: f.persona.trim(),
      greeting: f.greeting.trim(),
      keyterms: f.keyterms.split(',').map(k => k.trim()).filter(Boolean),
      voice: f.voice,
      // Accepts pasted numbered or bulleted scripts.
      script: f.script.split('\n').map(l => l.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-300 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div><label className={label}>Scenario title</label><input required maxLength={120} value={f.title} onChange={set('title')} className={input} /></div>
        <div>
          <label className={label}>Category</label>
          <select value={f.category} onChange={set('category')} className={input}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
        </div>
        <div><label className={label}>Difficulty</label><input maxLength={60} value={f.difficulty} onChange={set('difficulty')} className={input} /></div>
        <div><label className={label}>Customer name</label><input required maxLength={60} value={f.customerName} onChange={set('customerName')} className={input} /></div>
        <div>
          <label className={label}>Customer voice</label>
          <select value={f.voice} onChange={set('voice')} className={input}>{VOICES.map(v => <option key={v}>{v}</option>)}</select>
        </div>
        <div><label className={label}>Keyterms (comma separated)</label><input value={f.keyterms} onChange={set('keyterms')} placeholder="Brand names, products" className={input} /></div>
      </div>
      <div>
        <label className={label}>Situation and behaviour (written to the customer: "You are calling...")</label>
        <textarea required maxLength={2000} rows={4} value={f.persona} onChange={set('persona')} className={input} />
      </div>
      <div>
        <label className={label}>Opening line (spoken word for word when the call connects)</label>
        <input required maxLength={400} value={f.greeting} onChange={set('greeting')} className={input} />
      </div>
      <div>
        <label className={label}>Your call script (optional, one required step per line). Candidates are checked against every step.</label>
        <textarea rows={5} value={f.script} onChange={set('script')} className={input}
          placeholder={'Greet with the company name and your name\nVerify the account holder\nAcknowledge the concern\nGive a reference number\nClose with the company name'} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancel</button>
        <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer">Save scenario</button>
      </div>
    </form>
  );
};
