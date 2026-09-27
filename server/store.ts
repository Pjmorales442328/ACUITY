// Persists saved records (scorecards, custom scenarios) to local JSON files under data/.
import fs from 'fs';
import path from 'path';
import type { Scenario, Scorecard } from '../src/types';
import sampleCandidates from './sampleCandidates.json';

// seed: shown on a fresh install until the first save, so a new visitor has a report to open.
function jsonStore<T extends { id: string }>(name: string, seed: T[] = []) {
  const file = path.join(process.cwd(), 'data', `${name}.json`);
  let items: T[] = seed;
  try {
    items = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err: any) {
    if (err.code !== 'ENOENT') console.error(`[store] could not read ${file}`, err.message);
  }

  const persist = () => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(items, null, 2));
    } catch (err: any) {
      console.error(`[store] could not write ${file}`, err.message);
    }
  };

  return {
    list: () => items,
    add(item: T) {
      items = [item, ...items.filter(i => i.id !== item.id)];
      persist();
    },
    remove(id: string) {
      items = items.filter(i => i.id !== id);
      persist();
    }
  };
}

export const candidateStore = jsonStore<Scorecard>('candidates', sampleCandidates as Scorecard[]);
export const scenarioStore = jsonStore<Scenario>('scenarios');
