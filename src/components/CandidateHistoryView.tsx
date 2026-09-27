import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Trash2,
  Eye,
  Clock,
  Plus,
  MessageSquareText
} from 'lucide-react';
import { Scorecard, CefrLevel, HiringRecommendation } from '../types';

interface CandidateHistoryViewProps {
  candidates: Scorecard[];
  onSelectCandidate: (candidate: Scorecard) => void;
  onDeleteCandidate: (id: string) => void;
  onStartNewAssessment: () => void;
  onViewCandidateTranscript?: (candidate: Scorecard) => void;
}

export const CandidateHistoryView: React.FC<CandidateHistoryViewProps> = ({
  candidates,
  onSelectCandidate,
  onDeleteCandidate,
  onStartNewAssessment,
  onViewCandidateTranscript
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCefr, setFilterCefr] = useState<string>('ALL');
  const [filterRec, setFilterRec] = useState<string>('ALL');

  const filtered = candidates.filter(c => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.scenarioTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetRole.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCefr = filterCefr === 'ALL' || c.overallCefrLevel === filterCefr;
    const matchesRec = filterRec === 'ALL' || c.hiringRecommendation === filterRec;

    return matchesSearch && matchesCefr && matchesRec;
  });

  const getRecPill = (rec: HiringRecommendation) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'HIRE':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'HIRE_WITH_TRAINING':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-rose-50 border-rose-200 text-rose-800';
    }
  };

  const exportAllToCSV = () => {
    if (candidates.length === 0) return;
    const headers = ['Candidate Name,Email,Role,Scenario,CEFR,Fluency,Vocabulary,Grammar,Pronunciation,Empathy,Recommendation,Created At'];
    const rows = candidates.map(c => [
      `"${c.candidateName}"`,
      `"${c.candidateEmail}"`,
      `"${c.targetRole}"`,
      `"${c.scenarioTitle}"`,
      c.overallCefrLevel,
      c.fluencyScore,
      c.lexicalScore,
      c.grammarScore,
      c.pronunciationScore,
      c.empathyScore,
      c.hiringRecommendation,
      `"${c.createdAt}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acuityvoice_candidate_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Candidate ATS Evaluation Records
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Official candidate screening logs, CEFR ratings, and structured competency scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportAllToCSV}
            disabled={candidates.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-40 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onStartNewAssessment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, email, role..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition shadow-2xs"
          />
        </div>

        {/* CEFR Level Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">CEFR:</span>
          <select
            value={filterCefr}
            onChange={(e) => setFilterCefr(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none flex-1 font-medium cursor-pointer"
          >
            <option value="ALL">All Levels (A2 - C2)</option>
            <option value="C2">C2 Mastery</option>
            <option value="C1">C1 Effective</option>
            <option value="B2">B2 Vantage</option>
            <option value="B1">B1 Threshold</option>
            <option value="A2">A2 Elementary</option>
          </select>
        </div>

        {/* Recommendation Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Verdict:</span>
          <select
            value={filterRec}
            onChange={(e) => setFilterRec(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none flex-1 font-medium cursor-pointer"
          >
            <option value="ALL">All Verdicts</option>
            <option value="STRONG_HIRE">Strong Hire</option>
            <option value="HIRE">Hire</option>
            <option value="HIRE_WITH_TRAINING">Hire with Training</option>
            <option value="DO_NOT_HIRE">Do Not Hire</option>
          </select>
        </div>
      </div>

      {/* Candidate Records List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No candidate evaluations match your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(c => (
              <div
                key={c.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
              >
                {/* Candidate Information */}
                <div className="flex items-start gap-3">
                  {/* CEFR Level Box */}
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center font-bold text-xs shrink-0 font-mono shadow-2xs">
                    <span>{c.overallCefrLevel}</span>
                    <span className="text-[7px] text-slate-400 font-sans">CEFR</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {c.candidateName}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRecPill(c.hiringRecommendation)}`}>
                        {c.hiringRecommendation.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {c.targetRole} • <span className="text-slate-400">{c.candidateEmail}</span>
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 flex-wrap">
                      <span className="text-slate-700 font-medium truncate max-w-[220px]">
                        {c.scenarioTitle}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {Math.floor(c.sessionDurationSeconds / 60)}m {c.sessionDurationSeconds % 60}s
                      </span>
                      {c.finalSentimentScore !== undefined && (
                        <>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] border ${
                            c.finalSentimentScore >= 75
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            De-escalation: {c.finalSentimentScore}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scorecard Metric Chips & Action Buttons */}
                <div className="flex items-center justify-between w-full md:w-auto gap-3">
                  {/* Dimension Mini Chips */}
                  <div className="hidden lg:grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                    <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[8px] font-sans">Flu</span>
                      <span className="font-bold text-slate-900">{c.fluencyScore}%</span>
                    </div>
                    <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[8px] font-sans">Gra</span>
                      <span className="font-bold text-slate-900">{c.grammarScore}%</span>
                    </div>
                    <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[8px] font-sans">Voc</span>
                      <span className="font-bold text-slate-900">{c.lexicalScore}%</span>
                    </div>
                    <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[8px] font-sans">Pro</span>
                      <span className="font-bold text-slate-900">{c.pronunciationScore}%</span>
                    </div>
                    <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="text-emerald-700 block text-[8px] font-sans">Emp</span>
                      <span className="font-bold text-emerald-700">{c.empathyScore}%</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewCandidateTranscript ? onViewCandidateTranscript(c) : onSelectCandidate(c)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                      title="Inspect Candidate Conversation Transcript"
                    >
                      <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Transcript</span>
                    </button>
                    <button
                      onClick={() => onSelectCandidate(c)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                      title="Inspect Diagnostic Scorecard"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Audit</span>
                    </button>
                    <button
                      onClick={() => onDeleteCandidate(c.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Candidate Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

