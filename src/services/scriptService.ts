// Uploads a call script file for analysis into a reviewable playbook.
import type { Playbook } from '../types';

export async function analyzeScriptFile(file: File): Promise<Playbook> {
  const res = await fetch('/api/scripts/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
    body: file
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Analysis failed (${res.status})`);
  return body;
}
