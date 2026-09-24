/**
 * Offline-First Study Activity Ledger (Parent Dashboard data source)
 *
 * LocalStorage Key: aadir.study.activity
 * This module is a pure, SSR-safe persistence layer used to accumulate
 * per-response study records regardless of network connectivity, mirroring
 * the storage helpers and privacy-mode tolerance found in lib/adaptiveSession.ts.
 */

const LS_ACTIVITY = 'aadir.study.activity';
const MAX_RESPONSES = 1000;

/** Single answered question record captured at answer time. */
export interface StudyResponseRecord {
  qid: string;
  objectiveCode: string | null;
  subject: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  at: string; // ISO timestamp
}

/** Local ledger persisted under aadir.study.activity */
export interface StudyActivityLedger {
  responses: StudyResponseRecord[];
  activeDays: string[]; // 'YYYY-MM-DD' local days with any activity
  lastSessionAt?: string;
}

// ---------------------------------------------------------------------------
// Safe Storage Helpers (SSR / Privacy Mode tolerant)
// ---------------------------------------------------------------------------

function storageGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function storageSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / privacy-mode write failures
  }
}

/** Local (timezone-aware) day key, not UTC, so streaks align with the family's day. */
export function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Ledger Operations
// ---------------------------------------------------------------------------

export function getLedger(): StudyActivityLedger {
  return storageGet<StudyActivityLedger>(LS_ACTIVITY) || { responses: [], activeDays: [] };
}

/**
 * Record a single answered response locally.
 * Also marks the current local day as active (deduplicated).
 */
export function trackStudyResponse(rec: StudyResponseRecord): void {
  const ledger = getLedger();
  ledger.responses = [rec, ...ledger.responses].slice(0, MAX_RESPONSES);

  const day = toLocalDayKey(new Date(rec.at));
  if (!ledger.activeDays.includes(day)) {
    ledger.activeDays.push(day);
  }
  ledger.lastSessionAt = rec.at;

  storageSet(LS_ACTIVITY, ledger);
}

/** Mark the start time of a study session (used for session boundaries). */
export function trackSessionStart(at: string): void {
  const ledger = getLedger();
  ledger.lastSessionAt = at;
  storageSet(LS_ACTIVITY, ledger);
}

/** Wipe the local activity ledger (only used by maintenance flows). */
export function clearLedger(): void {
  storageSet(LS_ACTIVITY, { responses: [], activeDays: [] });
}