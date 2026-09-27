// Pass criteria for script-generated levels, shared by the server (scoring) and the UI (review screen).
// Common contact-center practice: a hire must handle objections; leaving nesting means handling a hostile caller near-perfectly.
export const BARS = {
  2: { name: 'Hiring bar', minAdherence: 70, readiness: ['READY', 'READY_WITH_COACHING'] },
  3: { name: 'Certification bar', minAdherence: 90, readiness: ['READY'] }
} as const;
