import { CefrLevel, HiringRecommendation, MarkerImpact, MarkerType, RadarScores, Scorecard } from '../types';

export function calculateCefrLevel(scores: RadarScores): CefrLevel {
  const avg = (scores.fluency + scores.grammar + scores.lexical + scores.pronunciation + scores.empathy) / 5;
  if (avg >= 88) return 'C2';
  if (avg >= 80) return 'C1';
  if (avg >= 70) return 'B2';
  if (avg >= 58) return 'B1';
  return 'A2';
}

export function calculateHiringRecommendation(scores: RadarScores, cefr: CefrLevel): HiringRecommendation {
  const avg = (scores.fluency + scores.grammar + scores.lexical + scores.pronunciation + scores.empathy) / 5;
  if (cefr === 'C2' || (cefr === 'C1' && scores.empathy >= 80 && avg >= 82)) {
    return 'STRONG_HIRE';
  }
  if (cefr === 'C1' || (cefr === 'B2' && scores.empathy >= 75 && avg >= 74)) {
    return 'HIRE';
  }
  if (cefr === 'B2' || (cefr === 'B1' && avg >= 62)) {
    return 'HIRE_WITH_TRAINING';
  }
  return 'DO_NOT_HIRE';
}

export function generateDiagnosticVerdict(
  scores: RadarScores,
  cefr: CefrLevel,
  candidateName: string,
  scenarioTitle: string
): { strengths: string[]; developmentAreas: string[]; verdict: string } {
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  if (scores.empathy >= 85) {
    strengths.push('Demonstrated exceptional active empathy and de-escalation composure during high-tension customer friction.');
  } else if (scores.empathy >= 75) {
    strengths.push('Maintained polite customer rapport and acknowledged customer distress promptly.');
  } else {
    developmentAreas.push('Incorporate more validating emotional statements before moving directly to administrative troubleshooting.');
  }

  if (scores.fluency >= 85) {
    strengths.push('Natural conversational cadence with steady pacing and absence of distracting hesitations or filler words.');
  } else if (scores.fluency >= 75) {
    strengths.push('Consistent spoken delivery with smooth turn-taking transitions.');
  } else {
    developmentAreas.push('Reduce vocal pauses and conversational stalling during complex multi-step explanations.');
  }

  if (scores.lexical >= 85) {
    strengths.push('Utilized advanced domain-appropriate vocabulary, professional terms, and customer recovery phrasing.');
  } else if (scores.lexical >= 75) {
    strengths.push('Accurate and clear vocabulary tailored to customer service.');
  } else {
    developmentAreas.push('Broaden specialized industry vocabulary and avoid repetitive colloquial phrases.');
  }

  if (scores.grammar >= 85) {
    strengths.push('Flawless syntactic range with accurate modal verbs and polite conditional phrasing.');
  } else {
    developmentAreas.push('Strengthen complex clause structures and past-tense dispute reconciliation framing.');
  }

  if (scores.pronunciation >= 85) {
    strengths.push('Clear phonetic articulation and neutral, highly intelligible international accent.');
  }

  // Ensure minimum 2 strengths and 1 development area
  if (strengths.length < 2) {
    strengths.push('Maintained steady professional tone throughout the simulated call.');
  }
  if (developmentAreas.length === 0) {
    developmentAreas.push('Ensure standard organizational wrap-up compliance scripts are recited word-for-word.');
  }

  const recommendation = calculateHiringRecommendation(scores, cefr);
  let verdict = '';
  if (recommendation === 'STRONG_HIRE') {
    verdict = `${candidateName || 'Candidate'} demonstrated outstanding ${cefr} spoken English proficiency, razor-sharp active listening, and exemplary emotional composure during the "${scenarioTitle}" roleplay. Recommended for immediate placement in Tier-2 VIP, Escalations, or high-value enterprise accounts.`;
  } else if (recommendation === 'HIRE') {
    verdict = `${candidateName || 'Candidate'} exhibited strong ${cefr} conversational competence, solid domain vocabulary, and effective customer recovery techniques. Approved for front-line customer advocacy and technical voice workflows.`;
  } else if (recommendation === 'HIRE_WITH_TRAINING') {
    verdict = `${candidateName || 'Candidate'} meets baseline ${cefr} linguistic standards with promising core skills. Recommend a 2-week targeted coaching module focusing on de-escalation phrasing and dispute compliance protocols prior to live queue assignment.`;
  } else {
    verdict = `${candidateName || 'Candidate'} struggled with real-time customer friction and complex oral grammar (${cefr} level). Currently below the threshold required for autonomous voice operations.`;
  }

  return { strengths, developmentAreas, verdict };
}

export function buildCompleteScorecard(
  candidateName: string,
  candidateEmail: string,
  targetRole: string,
  scenarioId: string,
  scenarioTitle: string,
  scores: RadarScores,
  durationSeconds: number,
  turnCount: number,
  markersCount: number
): Scorecard {
  const cefr = calculateCefrLevel(scores);
  const recommendation = calculateHiringRecommendation(scores, cefr);
  const { strengths, developmentAreas, verdict } = generateDiagnosticVerdict(scores, cefr, candidateName, scenarioTitle);

  return {
    id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    candidateName: candidateName || 'Candidate',
    candidateEmail: candidateEmail || 'candidate@example.com',
    targetRole: targetRole || 'Customer Support Specialist (Voice)',
    scenarioId,
    scenarioTitle,
    overallCefrLevel: cefr,
    fluencyScore: Math.round(scores.fluency),
    lexicalScore: Math.round(scores.lexical),
    grammarScore: Math.round(scores.grammar),
    pronunciationScore: Math.round(scores.pronunciation),
    empathyScore: Math.round(scores.empathy),
    keyStrengths: strengths,
    developmentAreas,
    hiringRecommendation: recommendation,
    summaryVerdict: verdict,
    sessionDurationSeconds: durationSeconds,
    turnCount,
    markersCount,
    createdAt: new Date().toISOString()
  };
}
