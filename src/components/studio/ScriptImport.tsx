// Upload a client playbook or call script (.docx, .pdf, .txt, .md), analyze it, and hand the reviewed levels back to the studio.
import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { analyzeScriptFile } from '../../services/scriptService';
import type { Playbook, Scenario } from '../../types';
import { PlaybookReview } from './PlaybookReview';

const SAMPLE_URL = '/samples/ApexPay_Program_Playbook.docx';

// autoSample: analyze the sample right away (the landing page's "Try the sample playbook" button).
export const ScriptImport: React.FC<{ onCreate: (levels: Scenario[]) => void; autoSample?: boolean; onAutoSampleStarted?: () => void }> = ({ onCreate, autoSample, onAutoSampleStarted }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);

  async function analyze(file: File) {
    setBusy(file.name);
    setError(null);
    try {
      setPlaybook(await analyzeScriptFile(file));
    } catch (err: any) {
      setError(err?.message || 'Could not analyze that playbook');
    } finally {
      setBusy(null);
    }
  }

  async function useSample() {
    try {
      const blob = await (await fetch(SAMPLE_URL)).blob();
      await analyze(new File([blob], 'ApexPay_Program_Playbook.docx'));
    } catch (err: any) {
      setError(err?.message || 'Could not load the sample playbook');
    }
  }

  const autoStarted = useRef(false); // StrictMode runs effects twice in dev; analyze once
  useEffect(() => {
    if (!autoSample || autoStarted.current) return;
    autoStarted.current = true;
    onAutoSampleStarted?.();
    useSample();
  }, [autoSample]);

  if (playbook) return <PlaybookReview playbook={playbook} onDiscard={() => setPlaybook(null)} onCreate={levels => { onCreate(levels); setPlaybook(null); }} />;

  return (
    <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <FileUp className="w-8 h-8 text-blue-600 shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900">Upload your client's playbook</h3>
        <p className="text-xs text-slate-600">
          AcuityVoice reads the playbook your agents must follow, finds every call type in it, and pulls out each one's call flow, critical steps, policies and objections. Every call type becomes three levels: practice, hiring bar and certification bar.
        </p>
        {error && <p role="alert" className="text-xs text-red-700 mt-1.5">{error}</p>}
      </div>
      {busy ? (
        <p className="flex items-center gap-2 text-xs text-slate-700"><Loader2 className="w-4 h-4 animate-spin" /> Reading {busy}: finding call types, rules and callers…</p>
      ) : (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={() => input.current?.click()} className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
            Choose file (.docx, .pdf, .txt)
          </button>
          <button onClick={useSample} className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">
            Try a sample playbook
          </button>
          <a href={SAMPLE_URL} download className="text-[11px] text-center text-blue-700 hover:underline">Download the sample</a>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept=".docx,.pdf,.txt,.md"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) analyze(f);
        }}
      />
    </div>
  );
};
