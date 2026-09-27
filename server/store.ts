// Persists saved records (scorecards, custom scenarios) to local JSON files under data/.
import fs from 'fs';
import path from 'path';
import type { Scenario, Scorecard } from '../src/types';

function jsonStore<T extends { id: string }>(name: string) {
  const file = path.join(process.cwd(), 'data', `${name}.json`);
  let items: T[] = [];
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

export const candidateStore = jsonStore<Scorecard>('candidates');
export const scenarioStore = jsonStore<Scenario>('scenarios');
