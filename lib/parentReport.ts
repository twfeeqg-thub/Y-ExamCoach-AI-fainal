/**
 * Parent Report Computation (pure functions, offline-first)
 *
 * Derives a caregiver-friendly report from the local study ledger
 * (lib/studyTracker.ts) plus the persisted adaptive session state.
 * Mirrors the server mastery rule (+10 correct / -5 wrong) already used
 * by lib/adaptiveSession.ts.
 */

import type {
  AdaptiveMasteryMap,
  AdaptiveSessionState,
  StudentProfile,
} from '@/types/index';
import type { StudyActivityLedger } from '@/lib/studyTracker';
import { toLocalDayKey } from '@/lib/studyTracker';

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface SubjectMastery {
  subject: string;
  objectivesCount: number;
  averageMastery: number | null;
  attempts: number;
  accuracy: number | null;
}

export type MasteryLevel = 'mastered' | 'progressing' | 'needs-work' | 'no-data';

export interface ObjectiveMasterySummary {
  code: string;
  label: string;
  score: number | null;
  consecutiveCorrect: number;
  attempts: number;
  level: MasteryLevel;
}

export interface RecentSession {
  startAt: string;
  dayLabel: string;
  subject: string;
  answered: number;
  correct: number;
  accuracy: number | null;
  studySeconds: number;
}

export interface ParentSummary {
  totalAnswered: number;
  correctCount: number;
  accuracy: number | null;
  totalStudySeconds: number;
  studyTimeLabel: string;
  overallMastery: number | null;
  trackedObjectives: number;
}

export interface ParentReport {
  summary: ParentSummary;
  bySubject: SubjectMastery[];
  objectives: ObjectiveMasterySummary[];
  streak: number;
  activeDaysCount: number;
  strengths: string[];
  needsWork: string[];
  recentSessions: RecentSession[];
}

export interface ParentReportInput {
  ledger?: StudyActivityLedger | null;
  sessionState?:
    | Pick<
        AdaptiveSessionState,
        'answeredCount' | 'subjectCode' | 'masteryByObjective' | 'answeredQuestionIds' | 'lastUpdatedAt'
      >
    | null;
  profile?: StudentProfile | null;
}

// ---------------------------------------------------------------------------
// Constants & Small Helpers
// ---------------------------------------------------------------------------

const MASTERED_THRESHOLD = 80;
const NEEDS_WORK_THRESHOLD = 50;
const SESSION_GAP_MS = 90 * 60 * 1000; // 90 minutes idle splits a session

const SUBJECT_PREFIX_MAP: Record<string, string> = {
  MATH: 'الرياضيات',
  PHYS: 'الفيزياء',
  CHEM: 'الكيمياء',
  BIO: 'الأحياء',
  BIOL: 'الأحياء',
  ARAB: 'اللغة العربية',
  ENG: 'اللغة الإنجليزية',
};

function subjectFromObjective(code: string | null): string {
  if (!code) return 'أهداف عامة';
  const prefix = code.split('-')[0].toUpperCase();
  return SUBJECT_PREFIX_MAP[prefix] || prefix || 'أهداف عامة';
}

function round(value: number): number {
  return Math.round(value);
}

export function formatStudyTime(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes <= 0) return '0 دقيقة';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} دقيقة`;
  if (minutes === 0) return `${hours} ساعة`;
  return `${hours} س و ${minutes} د`;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
}

function previousDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return toLocalDayKey(d);
}

// ---------------------------------------------------------------------------
// Main Report Builder
// ---------------------------------------------------------------------------

export function buildParentReport(
  input: ParentReportInput,
  objectiveLabels?: Record<string, string>
): ParentReport {
  const ledger = input?.ledger ?? { responses: [], activeDays: [] };
  const session = input?.sessionState ?? null;
  const masteryMap: AdaptiveMasteryMap = session?.masteryByObjective ?? {};
  const responses = ledger.responses;

  // --- Summary ---
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const totalAnswered = responses.length > 0 ? responses.length : (session?.answeredCount ?? 0);
  const accuracy = responses.length > 0 ? round((correctCount / responses.length) * 100) : null;
  const totalStudySeconds = responses.reduce(
    (sum, r) => sum + (r.timeTakenSeconds > 0 ? r.timeTakenSeconds : 0),
    0
  );

  // --- Per-objective attempt / correct tallies from the ledger ---
  const attemptsByObjective = new Map<string, number>();
  const correctByObjective = new Map<string, number>();
  for (const r of responses) {
    const code = r.objectiveCode;
    if (!code) continue;
    attemptsByObjective.set(code, (attemptsByObjective.get(code) ?? 0) + 1);
    if (r.isCorrect) correctByObjective.set(code, (correctByObjective.get(code) ?? 0) + 1);
  }

  // Combine mastery-map objectives with ledger-only objectives
  const scope = new Set<string>([...Object.keys(masteryMap), ...attemptsByObjective.keys()]);

  const resolvedScore = (code: string): number | null => {
    const fromMap = masteryMap[code]?.masteryScore ?? null;
    if (fromMap !== null) return fromMap;
    const attempts = attemptsByObjective.get(code) ?? 0;
    if (attempts > 0) {
      return round(((correctByObjective.get(code) ?? 0) / attempts) * 100);
    }
    return null;
  };

  // --- Overall weighted mastery (weight = attempts per objective) ---
  let weightedSum = 0;
  let weightTotal = 0;
  scope.forEach((code) => {
    const score = resolvedScore(code);
    if (score === null) return;
    const weight = Math.max(1, attemptsByObjective.get(code) ?? 0);
    weightedSum += score * weight;
    weightTotal += weight;
  });
  const overallMastery = weightTotal > 0 ? round(weightedSum / weightTotal) : null;

  // --- Objectives breakdown, weakest first ---
  const objectives: ObjectiveMasterySummary[] = [];
  scope.forEach((code) => {
    const score = resolvedScore(code);
    const level: MasteryLevel =
      score === null
        ? 'no-data'
        : score >= MASTERED_THRESHOLD
          ? 'mastered'
          : score >= NEEDS_WORK_THRESHOLD
            ? 'progressing'
            : 'needs-work';
    objectives.push({
      code,
      label: objectiveLabels?.[code] ?? code,
      score,
      consecutiveCorrect: masteryMap[code]?.consecutiveCorrect ?? 0,
      attempts: attemptsByObjective.get(code) ?? 0,
      level,
    });
  });
  const levelOrder: Record<MasteryLevel, number> = {
    'needs-work': 0,
    progressing: 1,
    mastered: 2,
    'no-data': 3,
  };
  objectives.sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level] || (a.score ?? 0) - (b.score ?? 0)
  );

  // --- Subject aggregation ---
  const subjectMap = new Map<string, { codes: string[]; attempts: number; correct: number }>();
  scope.forEach((code) => {
    const subject = subjectFromObjective(code);
    const entry = subjectMap.get(subject) ?? { codes: [], attempts: 0, correct: 0 };
    entry.codes.push(code);
    entry.attempts += attemptsByObjective.get(code) ?? 0;
    entry.correct += correctByObjective.get(code) ?? 0;
    subjectMap.set(subject, entry);
  });

  const bySubject: SubjectMastery[] = Array.from(subjectMap.entries()).map(([subject, g]) => {
    let sum = 0;
    let w = 0;
    for (const code of g.codes) {
      const score = masteryMap[code]?.masteryScore ?? null;
      if (score !== null) {
        sum += score * Math.max(1, attemptsByObjective.get(code) ?? 0);
        w += Math.max(1, attemptsByObjective.get(code) ?? 0);
      }
    }
    return {
      subject,
      objectivesCount: g.codes.length,
      averageMastery: w > 0 ? round(sum / w) : null,
      attempts: g.attempts,
      accuracy: g.attempts > 0 ? round((g.correct / g.attempts) * 100) : null,
    };
  });
  bySubject.sort((a, b) => b.attempts - a.attempts);

  // --- Active days streak (continuous up to today, or yesterday) ---
  const activeSet = new Set(ledger.activeDays);
  const todayKey = toLocalDayKey(new Date());
  const baseKey = activeSet.has(todayKey) ? todayKey : previousDayKey(todayKey);
  let streak = 0;
  let cursor = baseKey;
  while (activeSet.has(cursor)) {
    streak += 1;
    cursor = previousDayKey(cursor);
  }

  // --- Recent sessions (grouped by 90-minute inactivity windows) ---
  const chronological = [...responses].sort((a, b) => a.at.localeCompare(b.at));
  const sessions: RecentSession[] = [];
  let current: RecentSession | null = null;
  for (const r of chronological) {
    const startTime = new Date(r.at).getTime();
    if (!current || startTime - new Date(current.startAt).getTime() > SESSION_GAP_MS) {
      current = {
        startAt: r.at,
        dayLabel: formatDayLabel(new Date(r.at)),
        subject: r.subject,
        answered: 0,
        correct: 0,
        accuracy: null,
        studySeconds: 0,
      };
      sessions.push(current);
    }
    current.answered += 1;
    if (r.isCorrect) current.correct += 1;
    current.studySeconds += r.timeTakenSeconds > 0 ? r.timeTakenSeconds : 0;
    if (current.subject !== r.subject) current.subject = `${current.subject} + ${r.subject}`;
  }
  sessions.forEach((s) => {
    s.accuracy = s.answered > 0 ? round((s.correct / s.answered) * 100) : null;
  });
  const recentSessions = sessions.slice(-5).reverse();

  // --- Caregiver-friendly strengths & areas needing reinforcement ---
  const strengths = objectives
    .filter((o) => o.level === 'mastered' && o.score !== null)
    .map(
      (o) =>
        `متقن لهدف «${o.label}» بمعدل ${o.score}%. واصِل دعمه بحل يومي خفيف للحفاظ على هذا المستوى.`
    );

  const needsWork = objectives
    .filter((o) => o.level === 'needs-work' && o.score !== null)
    .map(
      (o) =>
        `يحتاج إلى مراجعة هدف «${o.label}» (الإتقان ${o.score}%). ننصح بجلسة تركيز قصيرة عليه يومياً.`
    );

  return {
    summary: {
      totalAnswered,
      correctCount,
      accuracy,
      totalStudySeconds,
      studyTimeLabel: formatStudyTime(totalStudySeconds),
      overallMastery,
      trackedObjectives: scope.size,
    },
    bySubject,
    objectives,
    streak,
    activeDaysCount: activeSet.size,
    strengths,
    needsWork,
    recentSessions,
  };
}