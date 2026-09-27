// Saved candidate assessments with search, readiness filter and CSV export.
import React, { useState } from 'react';
import { Download, Eye, Plus, Search, Trash2, Users } from 'lucide-react';
import { READINESS } from '../lib/labels';
import type { Readiness, Scorecard } from '../types';

interface CandidateHistoryViewProps {
  candidates: Scorecard[];
  onSelectCandidate: (candidate: Scorecard) => void;
  onDeleteCandidate: (id: string) => void;
  onStartNewAssessment: () => void;
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function exportCsv(candidates: Scorecard[]) {
  const header = ['Name', 'Email', 'Role', 'Scenario', 'Date', 'Readiness', 'CEFR', 'Script followed %', 'Bar', 'WPM', 'Fillers per 100 words', 'Summary'];
  const rows = candidates.map(c => [
    c.candidateName, c.candidateEmail, c.targetRole, c.scenarioTitle, c.createdAt,
    READINESS[c.readiness].label, c.cefr ?? '', c.scriptAdherence ?? '', c.bar ? `${c.bar.name}: ${c.bar.passed ? 'passed' : 'not passed'}` : '', c.metrics.wordsPerMinute, c.metrics.fillersPer100Words, c.summary
  ]);
  const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `acuityvoice_candidates_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const CandidateHistoryView: React.FC<CandidateHistoryViewProps> = ({ candidates, onSelectCandidate, onDeleteCandidate, onStartNewAssessment }) => {
  const [search, setSearch] = useState('');
  const [readiness, setReadiness] = useState<Readiness | 'ALL'>('ALL');

  const q = search.toLowerCase();
  const filtered = candidates.filter(c =>
    (readiness === 'ALL' || c.readiness === readiness) &&
    [c.candidateName, c.candidateEmail, c.targetRole, c.scenarioTitle].some(f => f.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Candidates</h1>
          <span className="text-xs text-slate-400">{candidates.length} assessed</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv(candidates)} disabled={!candidates.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={onStartNewAssessment} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New assessment
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 flex-1 min-w-[220px] bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, role or scenario" className="flex-1 text-xs text-slate-900 outline-none" />
        </label>
        <select value={readiness} onChange={e => setReadiness(e.target.value as Readiness | 'ALL')} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800">
          <option value="ALL">All readiness levels</option>
          {(Object.keys(READINESS) as Readiness[]).map(r => <option key={r} value={r}>{READINESS[r].label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
          {candidates.length ? 'No candidates match these filters.' : 'No assessments yet. Run a screening call to create the first one.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{c.candidateName}</p>
                  <p className="text-[11px] text-slate-500">{c.targetRole} · {new Date(c.createdAt).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">{c.scenarioTitle}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${READINESS[c.readiness].pill}`}>{READINESS[c.readiness].label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="CEFR" value={c.cefr ?? 'n/a'} />
                <Stat label="Words/min" value={String(c.metrics.wordsPerMinute)} />
                <Stat label="Fillers/100" value={String(c.metrics.fillersPer100Words)} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSelectCandidate(c)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer">
                  <Eye className="w-3.5 h-3.5" /> View scorecard
                </button>
                <button onClick={() => onDeleteCandidate(c.id)} aria-label={`Delete ${c.candidateName}`} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
    <span className="block text-[9px] uppercase text-slate-500 font-semibold">{label}</span>
    <span className="text-sm font-bold font-mono text-slate-900">{value}</span>
  </div>
);
