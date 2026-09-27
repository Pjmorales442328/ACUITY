// "How It Works" tab: the three-stage AssemblyAI pipeline and the design decisions behind it.
import React from 'react';

const STAGES = [
  {
    step: '1 · Live call',
    product: 'Voice Agent API',
    points: [
      'Plays the scenario customer with the persona, opening line and voice from Scenario Studio.',
      'transcription_mode "max_accuracy" so candidates who pause mid-sentence aren\'t cut off.',
      'Scenario keyterms (brand and product names) bias recognition.',
      'Barge-in: playback flushes on input.speech.started.',
      'No tools on the customer, so it never goes silent on a tool call.'
    ]
  },
  {
    step: '2 · Measure',
    product: 'Universal-3.5 Pro (pre-recorded)',
    points: [
      'The candidate\'s mic audio is recorded server-side during the call.',
      'Transcribed with disfluencies kept (um, uh, like) and keyterms prompting.',
      'Word timestamps give pace and hesitation pauses; word confidence flags unclear words.',
      'These metrics are computed in code, not guessed by a model.'
    ]
  },
  {
    step: '3 · Judge',
    product: 'Voice Agent API · JSON-Schema tool call',
    points: [
      'A second, short agent session receives the transcript and metrics.',
      'reply.create asks it to call submit_assessment; the tool arguments are the scorecard.',
      'Rubric: empathy, ownership, accuracy, clarity, language (1-5), plus CEFR level.',
      'Readiness is derived from the scores in code, so it always follows the rubric.'
    ]
  }
];

const DECISIONS = [
  ['Actor and judge are separate agents', 'Asking the roleplay customer to also log scores through tools made it go silent mid-call. Splitting the roles keeps the conversation natural and the grading consistent.'],
  ['Every finding is verified', 'Each quote must appear word for word in the Universal-3.5 Pro transcript. Findings that don\'t match are discarded and counted on the scorecard.'],
  ['Readiness signal, not a hiring decision', 'Hiring AI is high-risk under the EU AI Act. AcuityVoice reports Ready / Ready with coaching / Needs training with evidence, for a human reviewer to act on.'],
  ['Honest about thin samples', 'If the candidate says fewer than 25 words, the result is "Not enough speech" instead of a made-up score.']
];

export const ArchitectureDeckView: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-lg font-bold text-white">How AcuityVoice works</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-3xl">
        Contact centers screen thousands of applicants for spoken English and composure under pressure, usually with a scripted test or a
        recruiter's gut feeling. AcuityVoice puts every candidate on the same realistic, difficult call and returns a scorecard backed by what they actually said.
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      {STAGES.map(s => (
        <div key={s.step} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase text-slate-500">{s.step}</p>
          <p className="text-sm font-bold text-indigo-700">AssemblyAI {s.product}</p>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
            {s.points.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      ))}
    </div>

    <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] leading-relaxed text-slate-300 overflow-x-auto">{`Browser mic (24 kHz PCM) --> /ws/call --> Voice Agent API (customer persona)
       ^                         |                  |
       |  agent audio + events   |  records mic     v
       +-------------------------+          customer transcript
                                 |
                  End call --> Universal-3.5 Pro (disfluencies, word timings)
                                 |
                                 v
                       speech metrics (code) + timeline
                                 |
                                 v
          Voice Agent API evaluator --tool call--> submit_assessment
                                 |
                                 v
             quote verification --> readiness (code) --> scorecard`}</pre>

    <div className="grid gap-3 md:grid-cols-2">
      {DECISIONS.map(([title, body]) => (
        <div key={title} className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600 mt-1">{body}</p>
        </div>
      ))}
    </div>
  </div>
);
