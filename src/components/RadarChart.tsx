// Five-axis radar of the rubric dimension scores (1-5), with the "ready" threshold ring at 4.
import React from 'react';
import type { Dimension, DimensionScores } from '../types';

const AXES: { key: Dimension; label: string }[] = [
  { key: 'EMPATHY', label: 'Empathy' },
  { key: 'OWNERSHIP', label: 'Ownership' },
  { key: 'ACCURACY', label: 'Accuracy' },
  { key: 'CLARITY', label: 'Clarity' },
  { key: 'LANGUAGE', label: 'Language' }
];
const SIZE = 240;
const C = SIZE / 2;
const R = 80;

const point = (i: number, value: number) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  const r = (value / 5) * R;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const polygon = (values: number[]) => values.map((v, i) => point(i, v).map(n => n.toFixed(1)).join(',')).join(' ');

export const RadarChart: React.FC<{ scores: DimensionScores }> = ({ scores }) => {
  const values = AXES.map(a => scores[a.key]);
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[240px] overflow-visible" role="img" aria-label="Rubric scores radar chart">
      {[1, 2, 3, 4, 5].map(level => (
        <polygon key={level} points={polygon(AXES.map(() => level))} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <polygon points={polygon(AXES.map(() => 4))} fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="4 3" />
      <polygon points={polygon(values)} fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#2563eb" stroke="#fff" strokeWidth="1.5" />;
      })}
      {AXES.map((a, i) => {
        const [x, y] = point(i, 6.3);
        return (
          <text key={a.key} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold fill-slate-600">
            {a.label} {scores[a.key]}
          </text>
        );
      })}
    </svg>
  );
};
