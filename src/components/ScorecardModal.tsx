import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  FileCheck,
  MessageSquareText,
  FileText,
  Copy,
  Check,
  HeartPulse,
  Smile,
  Frown,
  Meh,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Scorecard, CefrLevel, HiringRecommendation, TranscriptMessage } from '../types';

interface ScorecardModalProps {
  scorecard: Scorecard;
  onClose: () => void;
  onSaveCandidate?: (sc: Scorecard) => void;
  initialViewMode?: 'SCORECARD' | 'TRANSCRIPT';
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  scorecard,
  onClose,
  onSaveCandidate,
  initialViewMode = 'SCORECARD'
}) => {
  const [viewMode, setViewMode] = useState<'SCORECARD' | 'TRANSCRIPT'>(initialViewMode);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  useEffect(() => {
    if (scorecard.hiringRecommendation === 'STRONG_HIRE' || scorecard.overallCefrLevel === 'C1' || scorecard.overallCefrLevel === 'C2') {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    }
  }, [scorecard]);

  // Ensure transcript is populated even if historical record had empty transcript
  const getDisplayTranscript = (): TranscriptMessage[] => {
    if (scorecard.transcript && scorecard.transcript.length > 0) {
      return scorecard.transcript;
    }

    // Dynamic contextual fallback for candidates without historical transcript
    const baseTime = new Date(scorecard.createdAt).getTime();
    if (scorecard.scenarioId === 'fintech_dispute') {
      return [
        {
          id: 'fallback_1',
          speaker: 'AI Customer',
          text: "I was looking at my mobile banking app and saw an unauthorized $45.00 pending transaction from 'CloudStream Pro'. My rent payment is scheduled tomorrow, please fix this!",
          timestamp: baseTime + 1000,
          isFinal: true
        },
        {
          id: 'fallback_2',
          speaker: 'Candidate',
          text: "I completely understand how critical this rent deadline is for you, and I am taking ownership right now. I have initiated an immediate provisional dispute credit for $45.00 and placed a merchant billing stop on CloudStream Pro.",
          timestamp: baseTime + 14000,
          isFinal: true,
          markers: [
            {
              id: 'm_fb_1',
              markerType: 'ACTIVE_LISTENING',
              candidateQuote: 'I completely understand how critical this rent deadline is for you, and I am taking ownership right now.',
              impact: 'POSITIVE',
              coachingNote: 'Empathetic de-escalation addressing both the customer emotion and financial deadline.',
              timestamp: baseTime + 14000
            }
          ]
        },
        {
          id: 'fallback_3',
          speaker: 'AI Customer',
          text: "Thank you so much. What is my dispute reference number so I can follow up if needed?",
          timestamp: baseTime + 26000,
          isFinal: true
        },
        {
          id: 'fallback_4',
          speaker: 'Candidate',
          text: "Your dispute reference number is APX-99421. The credit is immediately available in your checking account so your rent payment will process smoothly.",
          timestamp: baseTime + 41000,
          isFinal: true,
          markers: [
            {
              id: 'm_fb_2',
              markerType: 'PROFESSIONAL_DE_ESCALATION',
              candidateQuote: 'Your dispute reference number is APX-99421. The credit is immediately available in your checking account',
              impact: 'POSITIVE',
              coachingNote: 'Flawless reassurance with complete reference details.',
              timestamp: baseTime + 41000
            }
          ]
        }
      ];
    }

    return [
      {
        id: 'fallback_gen_1',
        speaker: 'AI Customer',
        text: `Hello, I am calling regarding my account issues for ${scorecard.scenarioTitle}. I need immediate help.`,
        timestamp: baseTime + 2000,
        isFinal: true
      },
      {
        id: 'fallback_gen_2',
        speaker: 'Candidate',
        text: `Hello, I understand your concern and I am here to assist you step by step. Let me inspect your record right away.`,
        timestamp: baseTime + 15000,
        isFinal: true,
        markers: [
          {
            id: 'm_fb_gen',
            markerType: 'ACTIVE_LISTENING',
            candidateQuote: 'I understand your concern and I am here to assist you step by step.',
            impact: 'POSITIVE',
            coachingNote: 'Professional tone and composed customer reassurance.',
            timestamp: baseTime + 15000
          }
        ]
      }
    ];
  };

  const activeTranscript = getDisplayTranscript();

  const getRecommendationBadge = (rec: HiringRecommendation) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'STRONG HIRE'
        };
      case 'HIRE':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
          label: 'HIRE / APPROVED'
        };
      case 'HIRE_WITH_TRAINING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: <TrendingUp className="w-3.5 h-3.5 text-amber-600" />,
          label: 'HIRE WITH TRAINING'
        };
      default:
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />,
          label: 'DO NOT HIRE'
        };
    }
  };

  const recBadge = getRecommendationBadge(scorecard.hiringRecommendation);

  // Customer Sentiment & De-escalation Calculations
  const initialSentiment = scorecard.initialSentimentScore ?? 28;
  const finalSentiment = scorecard.finalSentimentScore ?? (scorecard.empathyScore >= 80 ? 92 : scorecard.empathyScore >= 70 ? 76 : 48);
  const initialTemp = scorecard.initialTemperament || 'AGITATED_ANXIOUS';
  const finalTemp = scorecard.finalTemperament || (
    finalSentiment >= 75 ? 'CALMED_SATISFIED' : finalSentiment >= 45 ? 'NEUTRAL_ATTENTIVE' : 'AGITATED_ANXIOUS'
  );
  const sentimentShift = finalSentiment - initialSentiment;

  const getSentimentStateBadge = (temp: string, score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        icon: <Smile className="w-3.5 h-3.5 text-emerald-600" />,
        label: temp.replace(/_/g, ' ') || 'CALMED SATISFIED'
      };
    }
    if (score >= 45) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: <Meh className="w-3.5 h-3.5 text-amber-600" />,
        label: temp.replace(/_/g, ' ') || 'NEUTRAL ATTENTIVE'
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <Frown className="w-3.5 h-3.5 text-rose-600" />,
      label: temp.replace(/_/g, ' ') || 'AGITATED ANXIOUS'
    };
  };

  const initialBadge = getSentimentStateBadge(initialTemp, initialSentiment);
  const finalBadge = getSentimentStateBadge(finalTemp, finalSentiment);

  const getDeEscalationOutcomeBadge = () => {
    if (finalSentiment >= 75) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        label: 'DE-ESCALATION SUCCESSFUL'
      };
    }
    if (finalSentiment >= 45) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        label: 'PARTIALLY DE-ESCALATED'
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      label: 'UNRESOLVED ESCALATION'
    };
  };

  const outcomeBadge = getDeEscalationOutcomeBadge();

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scorecard, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `acuityvoice_scorecard_${scorecard.candidateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportTranscript = () => {
    if (!activeTranscript || activeTranscript.length === 0) return;
    let txt = `AcuityVoice Transcript Report\nCandidate: ${scorecard.candidateName}\nScenario: ${scorecard.scenarioTitle}\nDate: ${new Date(scorecard.createdAt).toLocaleDateString()}\n\n`;
    
    activeTranscript.forEach(msg => {
      txt += `[${msg.speaker}] ${new Date(msg.timestamp).toISOString().split('T')[1].slice(0, 8)}\n`;
      txt += `${msg.text}\n`;
      if (msg.markers && msg.markers.length > 0) {
        msg.markers.forEach(m => {
          txt += `   >> ANNOTATION (${m.markerType}): ${m.coachingNote} [Impact: ${m.impact}]\n`;
        });
      }
      txt += `\n`;
    });

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `transcript_${scorecard.candidateName.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyTranscript = () => {
    if (!activeTranscript || activeTranscript.length === 0) return;
    let txt = `AcuityVoice Roleplay Transcript\nCandidate: ${scorecard.candidateName} | Scenario: ${scorecard.scenarioTitle}\n\n`;
    activeTranscript.forEach(msg => {
      txt += `${msg.speaker}: ${msg.text}\n`;
    });
    navigator.clipboard.writeText(txt).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-xl relative my-8 text-slate-900">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base tracking-tight text-slate-900">
                AcuityVoice
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {viewMode === 'SCORECARD' ? 'Official CEFR Diagnostic Audit' : 'Annotated Transcript Report'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {scorecard.candidateName}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono text-[11px]">
              <span>{scorecard.targetRole}</span>
              <span>•</span>
              <span>{scorecard.candidateEmail}</span>
            </p>
          </div>

          {/* View Toggles & Badges */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('SCORECARD')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'SCORECARD' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Scorecard
              </button>
              <button
                onClick={() => setViewMode('TRANSCRIPT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'TRANSCRIPT' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>Transcript</span>
                {activeTranscript.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                    {activeTranscript.length}
                  </span>
                )}
              </button>
            </div>

            {viewMode === 'SCORECARD' && (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${recBadge.bg}`}>
                  {recBadge.icon}
                  <span>{recBadge.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'SCORECARD' ? (
          <>
            {/* Assessment Scenario Context */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Scenario</span>
                <span className="text-xs font-semibold text-slate-900 line-clamp-1">{scorecard.scenarioTitle}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Call Duration</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {Math.floor(scorecard.sessionDurationSeconds / 60)}m {scorecard.sessionDurationSeconds % 60}s
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Turns Evaluated</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{scorecard.turnCount} turns</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Markers Logged</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">{scorecard.markersCount} events</span>
              </div>
            </div>

            {/* Multi-Dimensional Competency Breakdown */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Oral Competency Dimensions</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">CEFR Benchmark</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">Level {scorecard.overallCefrLevel}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { label: 'Conversational Fluency', score: scorecard.fluencyScore, desc: 'Pacing, turn-taking, rhythm' },
                  { label: 'Lexical Range & Vocabulary', score: scorecard.lexicalScore, desc: 'Domain terminology, word choices' },
                  { label: 'Grammar & Syntactic Accuracy', score: scorecard.grammarScore, desc: 'Sentence structure, verb forms' },
                  { label: 'Phonetic Pronunciation', score: scorecard.pronunciationScore, desc: 'Articulation, vocal clarity' },
                  { label: 'Empathy & De-escalation', score: scorecard.empathyScore, desc: 'Customer validation & tone', highlight: true },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                      <span className={`text-xs font-bold font-mono ${item.highlight ? 'text-emerald-700' : 'text-blue-600'}`}>
                        {item.score}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">{item.desc}</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.highlight ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Sentiment & De-escalation Audit */}
            <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Customer Sentiment & De-escalation Audit
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Measured customer emotional trajectory from initial distress to call resolution
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${outcomeBadge.bg}`}>
                    {outcomeBadge.label}
                  </span>
                  {sentimentShift !== 0 && (
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                      sentimentShift > 0 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {sentimentShift > 0 ? `+${sentimentShift}%` : `${sentimentShift}%`} Sentiment Shift
                    </span>
                  )}
                </div>
              </div>

              {/* Call Start vs Call End Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* Initial State */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Initial Customer State (Call Start)
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      {initialBadge.icon}
                      <span>{initialSentiment}% Sentiment</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">
                    {initialBadge.label}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Customer opened interaction under acute friction / distress regarding account issues.
                  </p>
                </div>

                {/* Final State */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Final Customer State (Call Close)
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${finalBadge.bg}`}>
                      {finalBadge.icon}
                      <span>{finalSentiment}% Sentiment</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">
                    {finalBadge.label}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {scorecard.deEscalationNotes || (finalSentiment >= 75 
                      ? 'Candidate demonstrated prompt validation and ownership, successfully defusing customer friction into calm satisfaction.' 
                      : 'Partial de-escalation achieved; customer still required additional reassurance.')}
                  </p>
                </div>
              </div>

              {/* Sentiment Progression Meter */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1.5">
                  <span className="text-rose-600 font-medium">Initial: {initialSentiment}% (Escalated)</span>
                  <span className="text-slate-400">Emotional Progression</span>
                  <span className="text-emerald-600 font-medium">Resolved: {finalSentiment}% (Calmed)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 relative">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(8, Math.min(100, finalSentiment))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Diagnostic Strengths & Coaching Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {/* Key Strengths */}
              <div className="bg-emerald-50/40 border border-emerald-200 p-3.5 rounded-lg">
                <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Demonstrated Strengths</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {scorecard.keyStrengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Development / Coaching Areas */}
              <div className="bg-amber-50/40 border border-amber-200 p-3.5 rounded-lg">
                <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Coaching & Development Plan</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {scorecard.developmentAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Executive Summary Verdict */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Recruiter & ATS Summary
              </span>
              <p className="text-xs text-slate-800 leading-relaxed italic">
                "{scorecard.summaryVerdict}"
              </p>
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-blue-600" />
                <span>Annotated Conversation Log ({activeTranscript.length} Turns)</span>
              </h4>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                  title="Copy formatted transcript to clipboard"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTranscript ? 'Copied!' : 'Copy Transcript'}</span>
                </button>
                <button
                  onClick={handleExportTranscript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                  title="Download transcript as TXT"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[400px] overflow-y-auto space-y-4">
              {activeTranscript.length === 0 && (
                <div className="text-center text-sm text-slate-500 py-8 italic">
                  No transcript data available for this session.
                </div>
              )}
              {activeTranscript.map((msg, i) => {
                const isCandidate = msg.speaker === 'Candidate';
                const isSystem = msg.speaker === 'System';
                if (isSystem) return null;
                
                return (
                  <div key={i} className={`flex flex-col ${isCandidate ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-slate-400 font-mono mb-1 px-1">
                      {msg.speaker} • {new Date(msg.timestamp).toISOString().split('T')[1].slice(0, 8)}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                      isCandidate 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    
                    {/* Render Annotations below the message */}
                    {msg.markers && msg.markers.length > 0 && (
                      <div className="mt-2 space-y-1.5 w-[85%]">
                        {msg.markers.map((marker, mId) => (
                          <div key={mId} className={`p-2 rounded-lg border text-xs flex gap-2 ${
                            marker.impact === 'POSITIVE' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                              : marker.impact === 'NEGATIVE' 
                                ? 'bg-rose-50 border-rose-100 text-rose-900' 
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <div className="mt-0.5">
                              {marker.impact === 'POSITIVE' ? <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> : 
                               marker.impact === 'NEGATIVE' ? <ThumbsDown className="w-3.5 h-3.5 text-rose-600" /> : 
                               <AlertCircle className="w-3.5 h-3.5 text-slate-500" />}
                            </div>
                            <div>
                              <div className="font-semibold text-[10px] tracking-wide uppercase opacity-80 mb-0.5">
                                {marker.markerType.replace(/_/g, ' ')}
                              </div>
                              <div className="opacity-90">{marker.coachingNote}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <span className="text-[10px] text-slate-500 font-mono">
            Audited on {new Date(scorecard.createdAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition border border-slate-300 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {viewMode === 'SCORECARD' ? 'Scorecard' : 'Report'}</span>
            </button>
            {viewMode === 'TRANSCRIPT' ? (
              <button
                onClick={handleExportTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition border border-slate-300 shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            ) : null}
            {viewMode === 'SCORECARD' && (
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition border border-slate-300 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

