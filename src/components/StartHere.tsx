// First-visit guide: the three-step client workflow (playbook -> call -> pass/fail), each step one click away.
import { FileUp, PhoneCall, ClipboardCheck, X } from 'lucide-react';
import React, { useState } from 'react';

const KEY = 'acuity.startHere.hidden';

function readHidden() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

interface Props {
  onUpload: () => void;
  onReports: () => void;
  reportCount: number;
}

export function StartHere({ onUpload, onReports, reportCount }: Props) {
  const [hidden, setHidden] = useState(readHidden);
  if (hidden) return null;

  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ponytail: private mode, the strip just comes back next visit */
    }
  };

  const steps = [
    { icon: FileUp, title: 'Upload the client playbook', body: 'A .docx or .pdf becomes call types × 3 levels in about 15 seconds.', cta: 'Try the sample playbook', onClick: onUpload },
    { icon: PhoneCall, title: 'Put a candidate on a live call', body: 'An AssemblyAI voice agent plays the customer. Pick a scenario below and talk.', cta: 'Start below ↓', onClick: () => document.getElementById('call-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
    { icon: ClipboardCheck, title: 'Read the pass/fail verdict', body: 'Every playbook step checked against the candidate’s exact words.', cta: reportCount ? `Open reports (${reportCount})` : 'Open reports', onClick: onReports }
  ];

  return (
    <section aria-label="How to use AcuityVoice" className="relative mb-6 rounded-xl border border-indigo-400/30 bg-indigo-950/40 p-4 sm:p-5">
      <button onClick={hide} aria-label="Hide this guide" className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 text-xs font-semibold uppercase tracking-wider text-indigo-300">Start here · for BPO hiring and certification teams</p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body, cta, onClick }, i) => (
          <li key={title} className="flex flex-col rounded-lg bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs">{i + 1}</span>
              <Icon className="h-4 w-4 text-indigo-300" />
              {title}
            </div>
            <p className="mt-1 flex-1 text-sm text-slate-300">{body}</p>
            <button onClick={onClick} className="mt-3 self-start rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400">
              {cta}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
