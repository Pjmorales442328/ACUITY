// App shell: tab routing, scenario library, candidate history and the scorecard modal.
import React, { useEffect, useState } from 'react';
import { ArchitectureDeckView } from './components/ArchitectureDeckView';
import { CandidateHistoryView } from './components/CandidateHistoryView';
import { Header } from './components/Header';
import { ScenarioStudioView } from './components/ScenarioStudioView';
import { ScorecardModal } from './components/scorecard/ScorecardModal';
import { DEFAULT_SCENARIOS } from './data/scenarios';
import { ScreeningPage } from './features/screening/ScreeningPage';
import { deleteCandidate, fetchCandidates } from './services/candidateService';
import { fetchCustomScenarios, saveScenario } from './services/scenarioService';
import type { ActiveTab, Scenario, Scorecard } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('SCREENING');
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_SCENARIOS[0].id);
  const [candidates, setCandidates] = useState<Scorecard[]>([]);
  const [latest, setLatest] = useState<Scorecard | null>(null);
  const [openScorecard, setOpenScorecard] = useState<Scorecard | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    fetchCandidates().then(setCandidates).catch(err => console.error(err));
    fetchCustomScenarios().then(custom => setScenarios([...custom, ...DEFAULT_SCENARIOS])).catch(err => console.error(err));
  }, []);

  const handleScorecard = (sc: Scorecard) => {
    setLatest(sc);
    setCandidates(prev => [sc, ...prev]);
    setOpenScorecard(sc);
  };

  const handleDelete = (id: string) => {
    deleteCandidate(id)
      .then(() => setCandidates(prev => prev.filter(c => c.id !== id)))
      .catch(err => alert(err.message));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} candidateCount={candidates.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Kept mounted (hidden) so switching tabs never drops a live call. */}
        <div hidden={activeTab !== 'SCREENING'}>
          <ScreeningPage
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
            setSelectedScenarioId={setSelectedScenarioId}
            latestScorecard={latest}
            onScorecard={handleScorecard}
            onViewScorecard={() => latest && setOpenScorecard(latest)}
            briefOpen={briefOpen}
            setBriefOpen={setBriefOpen}
          />
        </div>
        {activeTab === 'CANDIDATES' && (
          <CandidateHistoryView
            candidates={candidates}
            onSelectCandidate={setOpenScorecard}
            onDeleteCandidate={handleDelete}
            onStartNewAssessment={() => setActiveTab('SCREENING')}
          />
        )}
        {activeTab === 'SCENARIOS' && (
          <ScenarioStudioView
            scenarios={scenarios}
            activeScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
            onStartRoleplay={id => {
              setSelectedScenarioId(id);
              setActiveTab('SCREENING');
              setBriefOpen(true);
            }}
            onAddScenarios={async list => {
              try {
                // The store prepends, so save in reverse to keep level 1 first after a reload.
                for (const sc of [...list].reverse()) await saveScenario(sc);
                setScenarios(prev => [...list, ...prev]);
                setSelectedScenarioId(list[0].id);
              } catch (err: any) {
                alert(err.message);
              }
            }}
          />
        )}
        {activeTab === 'ARCHITECTURE_DECK' && <ArchitectureDeckView />}
      </main>

      {openScorecard && <ScorecardModal scorecard={openScorecard} onClose={() => setOpenScorecard(null)} />}
    </div>
  );
}

export default App;
