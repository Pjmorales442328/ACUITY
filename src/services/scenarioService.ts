// REST calls for custom scenarios saved from Scenario Studio.
import type { Scenario } from '../types';

export async function fetchCustomScenarios(): Promise<Scenario[]> {
  const res = await fetch('/api/scenarios');
  if (!res.ok) throw new Error(`Could not load scenarios (${res.status})`);
  return res.json();
}

export async function saveScenario(scenario: Scenario): Promise<Scenario> {
  const res = await fetch('/api/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario)
  });
  if (!res.ok) throw new Error(`Could not save scenario (${res.status})`);
  return res.json();
}
