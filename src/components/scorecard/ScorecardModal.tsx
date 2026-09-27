// Full assessment report: readiness, measured speech, quoted evidence, and the call transcript.
import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import type { Scorecard } from '../../types';
import { CallTranscript } from './CallTranscript';
import { EvidenceList } from './EvidenceList';
import { ReadinessHeader } from './ReadinessHeader';
import { ScriptChecklist } from './ScriptChecklist';
import { SpeechMetricsGrid } from './SpeechMetricsGrid';

type Tab = 'REPORT' | 'TRANSCRIPT';

export const ScorecardModal: React.FC<{ scorecard: Scorecard; onClose: () => void }> = ({ scorecard: sc, onClose }) => {
  const [tab, setTab] = useState<Tab>('REPORT');
  const [focusMs, setFocusMs] = useState<number | null>(null);

  const jumpTo = (ms: number) => {
    setFocusMs(ms);
    setTab('TRANSCRIPT');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Scorecard for ${sc.candidateName}`}
        className="bg-white text-slate-900 rounded-2xl shadow-xl w-full max-w-4xl my-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold">{sc.candidateName}</h2>
            <p className="text-xs text-slate-500">
              {sc.targetRole} · {sc.scenarioTitle} · {new Date(sc.createdAt).toLocaleString()} · {sc.durationSeconds}s call
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Save PDF
            </button>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-3 print:hidden">
          {(['REPORT', 'TRANSCRIPT'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t === 'REPORT' ? 'Report' : 'Transcript'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-6">
          {tab === 'REPORT' ? (
            <>
              <ReadinessHeader sc={sc} />
              <ScriptChecklist steps={sc.scriptSteps || []} adherence={sc.scriptAdherence ?? null} onJump={jumpTo} />
              <SpeechMetricsGrid m={sc.metrics} />
              <EvidenceList findings={sc.findings} rejected={sc.rejectedFindings} onJump={jumpTo} />
            </>
          ) : (
            <CallTranscript lines={sc.transcript} findings={sc.findings} focusMs={focusMs} candidateName={sc.candidateName} />
          )}
        </div>
      </div>
    </div>
  );
};
