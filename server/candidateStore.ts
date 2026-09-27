// Persists completed scorecards to a local JSON file.
import fs from 'fs';
import path from 'path';
import type { Scorecard } from '../src/types';

const FILE = path.join(process.cwd(), 'data', 'candidates.json');

function load(): Scorecard[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (err: any) {
    if (err.code !== 'ENOENT') console.error('[candidateStore] could not read', FILE, err.message);
    return [];
  }
}

let candidates = load();

function persist() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(candidates, null, 2));
  } catch (err: any) {
    console.error('[candidateStore] could not write', FILE, err.message);
  }
}

export const candidateStore = {
  list: () => candidates,
  add(sc: Scorecard) {
    candidates = [sc, ...candidates];
    persist();
  },
  remove(id: string) {
    candidates = candidates.filter(c => c.id !== id);
    persist();
  }
};
