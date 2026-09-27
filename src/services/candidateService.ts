// REST calls for the saved candidate scorecards.
import type { Scorecard } from '../types';

export async function fetchCandidates(): Promise<Scorecard[]> {
  const res = await fetch('/api/candidates');
  if (!res.ok) throw new Error(`Could not load candidates (${res.status})`);
  return res.json();
}

export async function deleteCandidate(id: string): Promise<void> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Could not delete candidate (${res.status})`);
}
