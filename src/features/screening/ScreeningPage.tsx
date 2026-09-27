// Live screening tab: candidate details, the roleplay call, and the latest result.
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { AudioWaveform } from '../../components/AudioWaveform';
import { CallBriefModal } from '../../components/CallBriefModal';
import { CandidateControls } from '../../components/CandidateControls';
import { CandidateProfileCard } from '../../components/CandidateProfileCard';
import { GuideModal } from '../../components/GuideModal';
import { TranscriptFeed } from '../../components/TranscriptFeed';
import { useVoiceCall } from '../../hooks/useVoiceCall';
import type { Scenario, Scorecard } from '../../types';
import { ScenarioContextCard } from './ScenarioContextCard';

const MAX_SECONDS = 180;

interface ScreeningPageProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  latestScorecard: Scorecard | null;
  onScorecard: (sc: Scorecard) => void;
  onViewScorecard: () => void;
  briefOpen: boolean;
  setBriefOpen: (open: boolean) => void;
}

export const ScreeningPage: React.FC<ScreeningPageProps> = props => {
  const { scenarios, selectedScenarioId, latestScorecard, briefOpen, setBriefOpen } = props;
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [targetRole, setTargetRole] = useState('Customer Service Representative');
  const [guideOpen, setGuideOpen] = useState(false);
  const call = useVoiceCall(props.onScorecard);

  const scenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  const inCall = call.phase === 'connecting' || call.phase === 'live';
  const status =
    call.phase === 'live'
      ? call.agentSpeaking ? `${scenario.customerName} is speaking...` : call.candidateSpeaking ? 'You are speaking...' : 'Your turn: respond to the customer'
      : call.phase === 'analyzing' ? 'Call ended. Assessing...' : 'Ready';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Live Screening</h1>
          <p className="text-xs text-slate-400 mt-1">Put the candidate on a realistic customer call, then get an evidence-backed readiness report.</p>
        </div>
        <button onClick={() => setGuideOpen(true)} className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer">
          <HelpCircle className="w-4 h-4 text-blue-400" /> How it works
        </button>
      </div>

      <CandidateProfileCard
        candidateName={candidateName} setCandidateName={setCandidateName}
        candidateEmail={candidateEmail} setCandidateEmail={setCandidateEmail}
        targetRole={targetRole} setTargetRole={setTargetRole}
        scenarios={scenarios} selectedScenarioId={selectedScenarioId} setSelectedScenarioId={props.setSelectedScenarioId}
        isCallActive={inCall || call.phase === 'analyzing'}
      />

      <AudioWaveform
        isCallActive={inCall}
        isAiSpeaking={call.agentSpeaking}
        isCandidateSpeaking={call.candidateSpeaking}
        analyserNode={call.agentSpeaking ? call.analysers.agent : call.analysers.mic}
        statusText={status}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <TranscriptFeed lines={call.lines} interim={call.interim} candidateName={candidateName} customerName={scenario.customerName} />
          <CandidateControls
            phase={call.phase} elapsed={call.elapsed} maxSeconds={MAX_SECONDS}
            candidateTurns={call.lines.filter(l => l.speaker === 'Candidate').length}
            fillers={call.fillers} notice={call.notice} error={call.error}
            hasScorecard={Boolean(latestScorecard)}
            onStart={() => setBriefOpen(true)} onEnd={call.end} onViewScorecard={props.onViewScorecard}
          />
        </div>
        <div className="lg:col-span-5">
          <ScenarioContextCard scenario={scenario} />
        </div>
      </div>

      {briefOpen && (
        <CallBriefModal
          scenario={scenario}
          candidateName={candidateName}
          onCancel={() => setBriefOpen(false)}
          onConnect={() => {
            setBriefOpen(false);
            call.start(scenario, { candidateName, candidateEmail, targetRole });
          }}
        />
      )}
      <GuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};
