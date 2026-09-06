import React from 'react';
import { RadarScores, CefrLevel } from '../types';
import { calculateCefrLevel } from '../utils/scoringEngine';
import { Activity, Sparkles } from 'lucide-react';

interface RadarChartProps {
  scores: RadarScores;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const cefr: CefrLevel = calculateCefrLevel(scores);

  const dimensions = [
    { key: 'fluency', label: 'Fluency', value: scores.fluency, angle: -90 },
    { key: 'grammar', label: 'Grammar', value: scores.grammar, angle: -18 },
    { key: 'lexical', label: 'Vocabulary', value: scores.lexical, angle: 54 },
    { key: 'pronunciation', label: 'Pronunciation', value: scores.pronunciation, angle: 126 },
    { key: 'empathy', label: 'Empathy', value: scores.empathy, angle: 198 },
  ];

  const size = 260;
  const center = size / 2;
  const radius = 88;

  const getCoordinates = (angleInDegrees: number, val: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angleInRadians);
    const y = center + r * Math.sin(angleInRadians);
    return { x, y };
  };

  // Polygon points
  const pointsString = dimensions
    .map(d => {
      const { x, y } = getCoordinates(d.angle, d.value);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Benchmark Polygon points (75% B2 target)
  const benchmarkString = dimensions
    .map(d => {
      const { x, y } = getCoordinates(d.angle, 75);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const gridLevels = [25, 50, 75, 100];

  const cefrColorMap: Record<CefrLevel, { bg: string; text: string; border: string; title: string }> = {
    C2: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', title: 'Mastery' },
    C1: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', title: 'Effective' },
    B2: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', title: 'Vantage' },
    B1: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', title: 'Threshold' },
    A2: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', title: 'Elementary' },
  };

  const cefrStyle = cefrColorMap[cefr] || cefrColorMap.B2;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">CEFR 5-Axis Diagnostic Matrix</h3>
        </div>
        <div className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${cefrStyle.bg} ${cefrStyle.text} ${cefrStyle.border}`}>
          Level {cefr} • {cefrStyle.title}
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center my-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
          {/* Concentric grid rings */}
          {gridLevels.map(level => {
            const r = (level / 100) * radius;
            return (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={level === 100 ? 'none' : '2 2'}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {dimensions.map(d => {
            const { x, y } = getCoordinates(d.angle, 100);
            return (
              <line
                key={d.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark Target (75% B2) */}
          <polygon
            points={benchmarkString}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Candidate Evaluated Area */}
          <polygon
            points={pointsString}
            fill="rgba(37, 99, 235, 0.12)"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Vertex Points */}
          {dimensions.map(d => {
            const { x, y } = getCoordinates(d.angle, d.value);
            return (
              <circle
                key={d.key}
                cx={x}
                cy={y}
                r="3.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Labels */}
          {dimensions.map(d => {
            const labelCoord = getCoordinates(d.angle, 122);
            return (
              <text
                key={d.key}
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-semibold fill-slate-600 select-none font-sans"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Metric Score Breakdown */}
      <div className="grid grid-cols-5 gap-1.5 w-full mt-2 text-center">
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] text-slate-500 block font-medium">Fluency</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{scores.fluency}%</span>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] text-slate-500 block font-medium">Grammar</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{scores.grammar}%</span>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] text-slate-500 block font-medium">Vocab</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{scores.lexical}%</span>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] text-slate-500 block font-medium">Pronun</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{scores.pronunciation}%</span>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] text-emerald-700 block font-medium">Empathy</span>
          <span className="text-xs font-bold text-emerald-700 font-mono">{scores.empathy}%</span>
        </div>
      </div>
    </div>
  );
};

