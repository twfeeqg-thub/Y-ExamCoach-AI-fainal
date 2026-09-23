'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Question,
  StudentProfile,
  StudentProfileInput,
  AdaptiveMasteryMap,
  AdaptiveObjectiveMastery,
  PendingResponse,
  CorrectOption,
} from '@/types/index';
import { useApp } from '@/context/AppContext';

// ---------------------------------------------------------------------------
// LocalStorage Keys (Offline-First Persistent Store)
// ---------------------------------------------------------------------------

const LS_STUDENT_ID = 'aadir.student.id';
const LS_STUDENT_PROFILE = 'aadir.student.profile';
const LS_QUESTION_CACHE = 'aadir.adaptive.questionCache';
const LS_PENDING = 'aadir.adaptive.pending';
const LS_SESSION_STATE = 'aadir.adaptive.sessionState';

const MAX_QUESTION_CACHE = 10;
const DEFAULT_SESSION_TARGET = 10;

// ---------------------------------------------------------------------------
// Safe Storage Helpers (Privacy Mode / SSR Safe)
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

function generateClientId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to manual generation
  }
  return 'sid-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Pure Mastery Computation (mirrors server rule: +10 correct / -5 wrong)
// ---------------------------------------------------------------------------

export function applyMasteryUpdate(
  current: AdaptiveObjectiveMastery,
  isCorrect: boolean
): AdaptiveObjectiveMastery {
  if (isCorrect) {
    return {
      masteryScore: Math.min(100, current.masteryScore + 10),
      consecutiveCorrect: current.consecutiveCorrect + 1,
    };
  }
  return {
    masteryScore: Math.max(0, current.masteryScore - 5),
    consecutiveCorrect: 0,
  };
}

// ---------------------------------------------------------------------------
// Adaptive Session Hook
// ---------------------------------------------------------------------------

export function useAdaptiveSession() {
  const { databaseStatus, questions } = useApp();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjectCode, setSubjectCode] = useState<string>('الرياضيات');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [pendingQueue, setPendingQueue] = useState<PendingResponse[]>([]);
  const [questionCache, setQuestionCache] = useState<Question[]>([]);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [sessionTarget, setSessionTarget] = useState<number>(DEFAULT_SESSION_TARGET);
  const [masteryByObjective, setMasteryByObjective] = useState<AdaptiveMasteryMap>({});
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Refs mirroring latest values to avoid stale closures inside callbacks
  const studentIdRef = useRef<string | null>(null);
  const subjectRef = useRef<string>(subjectCode);
  const cacheRef = useRef<Question[]>([]);
  const pendingRef = useRef<PendingResponse[]>([]);
  const currentQuestionRef = useRef<Question | null>(null);
  const answeredIdsRef = useRef<Set<string>>(new Set());
  const usedIdsRef = useRef<Set<string>>(new Set());
  const questionsRef = useRef<Question[]>(questions);
  const dbStatusRef = useRef<'online' | 'offline' | 'checking'>(databaseStatus);
  const syncLockRef = useRef<boolean>(false);

  subjectRef.current = subjectCode;
  cacheRef.current = questionCache;
  pendingRef.current = pendingQueue;
  currentQuestionRef.current = currentQuestion;
  questionsRef.current = questions;
  dbStatusRef.current = databaseStatus;

  // -------------------------------------------------------------------------
  // Hydration (mount only, SSR-safe)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let sid = storageGet<string>(LS_STUDENT_ID);
    if (!sid) {
      sid = generateClientId();
      storageSet(LS_STUDENT_ID, sid);
    }
    studentIdRef.current = sid;
    setStudentId(sid);

    const storedProfile = storageGet<StudentProfile>(LS_STUDENT_PROFILE);
    if (storedProfile) setProfile(storedProfile);

    const storedCache = storageGet<Question[]>(LS_QUESTION_CACHE) || [];
    setQuestionCache(storedCache);
    cacheRef.current = storedCache;

    const storedPending = storageGet<PendingResponse[]>(LS_PENDING) || [];
    setPendingQueue(storedPending);
    pendingRef.current = storedPending;

    const storedState = storageGet<{
      answeredCount: number;
      sessionTarget: number;
      masteryByObjective: AdaptiveMasteryMap;
      answeredQuestionIds: string[];
    }>(LS_SESSION_STATE);
    if (storedState) {
      setAnsweredCount(storedState.answeredCount || 0);
      setSessionTarget(storedState.sessionTarget || DEFAULT_SESSION_TARGET);
      setMasteryByObjective(storedState.masteryByObjective || {});
      answeredIdsRef.current = new Set(storedState.answeredQuestionIds || []);
      usedIdsRef.current = new Set(storedState.answeredQuestionIds || []);
    }
  }, []);

  // Persist session state whenever core counters change
  useEffect(() => {
    if (!studentId) return;
    storageSet(LS_SESSION_STATE, {
      studentId,
      subjectCode,
      answeredCount,
      sessionTarget,
      masteryByObjective,
      answeredQuestionIds: Array.from(answeredIdsRef.current),
      currentQuestion: currentQuestionRef.current,
      lastUpdatedAt: new Date().toISOString(),
    });
  }, [studentId, subjectCode, answeredCount, sessionTarget, masteryByObjective, currentQuestion]);

  // -------------------------------------------------------------------------
  // Profile Creation (local-first, synced to server when online)
  // -------------------------------------------------------------------------
  const saveProfile = useCallback(async (input: StudentProfileInput): Promise<void> => {
    const sid = studentIdRef.current;
    if (!sid) return;

    const localProfile: StudentProfile = {
      id: sid,
      grade: input.grade,
      section: input.section ?? null,
      governorate: input.governorate ?? null,
      targetSubject: input.targetSubject ?? null,
    };
    storageSet(LS_STUDENT_PROFILE, localProfile);
    setProfile(localProfile);
    if (input.targetSubject) {
      setSubjectCode(input.targetSubject);
      subjectRef.current = input.targetSubject;
    }

    if (dbStatusRef.current === 'online') {
      try {
        await fetch('/api/student/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sid, ...input }),
        });
      } catch {
        // Server profile creation deferred to next online sync
      }
    }
  }, []);

  const ensureServerProfile = useCallback(async (): Promise<void> => {
    const sid = studentIdRef.current;
    const storedProfile = storageGet<StudentProfile>(LS_STUDENT_PROFILE);
    if (!sid || !storedProfile) return;
    try {
      await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sid,
          grade: storedProfile.grade,
          section: storedProfile.section,
          governorate: storedProfile.governorate,
          targetSubject: storedProfile.targetSubject,
        }),
      });
    } catch {
      // Idempotent; retried on next sync
    }
  }, []);

  // -------------------------------------------------------------------------
  // Cache Management
  // -------------------------------------------------------------------------
  const prefetchCache = useCallback(async (): Promise<void> => {
    const sid = studentIdRef.current;
    if (!sid) return;
    try {
      const res = await fetch(
        `/api/student/next-question?studentId=${encodeURIComponent(sid)}&subjectCode=${encodeURIComponent(subjectRef.current)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const q = json.data as Question;
        if (!usedIdsRef.current.has(q.id) && !cacheRef.current.some((c) => c.id === q.id)) {
          const nextCache = [q, ...cacheRef.current].slice(0, MAX_QUESTION_CACHE);
          cacheRef.current = nextCache;
          setQuestionCache(nextCache);
          storageSet(LS_QUESTION_CACHE, nextCache);
        }
      }
    } catch {
      // Ignore prefetch failures offline
    }
  }, []);

  // -------------------------------------------------------------------------
  // Next Question Loading: online API -> local cache -> local question bank
  // -------------------------------------------------------------------------
  const loadNext = useCallback(
    async (opts?: { initial?: boolean }): Promise<void> => {
      const sid = studentIdRef.current;
      if (!sid) {
        if (opts?.initial) setIsStarting(false);
        return;
      }

      const isOnline = dbStatusRef.current === 'online';
      let nextQuestion: Question | null = null;

      if (isOnline) {
        try {
          const res = await fetch(
            `/api/student/next-question?studentId=${encodeURIComponent(sid)}&subjectCode=${encodeURIComponent(subjectRef.current)}`
          );
          const json = await res.json();
          if (json.success && json.data) nextQuestion = json.data as Question;
        } catch {
          nextQuestion = null;
        }
      }

      if (!nextQuestion && opts?.initial) {
        if (isOnline) await prefetchCache();
        nextQuestion = cacheRef.current.find((q) => !usedIdsRef.current.has(q.id)) ?? null;
      } else if (!nextQuestion) {
        nextQuestion = cacheRef.current.find((q) => !usedIdsRef.current.has(q.id)) ?? null;
      }

      // Offline last-resort fallback: local (already-loaded) question bank
      if (!nextQuestion) {
        nextQuestion =
          questionsRef.current.find(
            (q) =>
              q.subject === subjectRef.current &&
              q.learningObjectiveCode !== null &&
              !usedIdsRef.current.has(q.id)
          ) ?? null;
      }

      if (nextQuestion) {
        usedIdsRef.current.add(nextQuestion.id);
        setCurrentQuestion(nextQuestion);
        currentQuestionRef.current = nextQuestion;
        if (isOnline) prefetchCache();
      } else {
        setCurrentQuestion(null);
        currentQuestionRef.current = null;
      }

      if (opts?.initial) setIsStarting(false);
    },
    [prefetchCache]
  );

  const startSession = useCallback(
    async (subject: string): Promise<void> => {
      setIsStarting(true);
      setSubjectCode(subject);
      subjectRef.current = subject;
      await loadNext({ initial: true });
    },
    [loadNext]
  );

  // -------------------------------------------------------------------------
  // Response Recording (local-first) + Auto Sync
  // -------------------------------------------------------------------------
  const recordResponseAndSync = useCallback(
    async (userId: string, questionId: string, selectedOption: CorrectOption, timeTaken: number, hintUsed: boolean): Promise<boolean> => {
      const isCorrectPayload = selectedOption;
      const q = currentQuestionRef.current;
      const isCorrect = q ? selectedOption === q.correctOption : false;

      const objectiveCode = q?.learningObjectiveCode || null;
      const prevMastery: AdaptiveObjectiveMastery = objectiveCode
        ? (masteryByObjective[objectiveCode] ?? { masteryScore: 0, consecutiveCorrect: 0 })
        : { masteryScore: 0, consecutiveCorrect: 0 };
      const nextMastery = applyMasteryUpdate(prevMastery, isCorrect);

      setMasteryByObjective((prev) => {
        const next = { ...prev };
        if (objectiveCode) next[objectiveCode] = nextMastery;
        return next;
      });

      answeredIdsRef.current.add(questionId);
      setAnsweredCount((c) => c + 1);

      const pending: PendingResponse = {
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        studentId: userId,
        questionId,
        selectedOption: isCorrectPayload,
        isCorrect,
        timeTakenSeconds: timeTaken,
        hintUsed,
      };

      setPendingQueue((prev) => {
        const next = [pending, ...prev];
        pendingRef.current = next;
        storageSet(LS_PENDING, next);
        return next;
      });

      return isCorrect;
    },
    [masteryByObjective]
  );

  const flushPending = useCallback(async (): Promise<void> => {
    if (syncLockRef.current) return;
    const sid = studentIdRef.current;
    if (!sid || pendingRef.current.length === 0) return;

    syncLockRef.current = true;
    setIsSyncing(true);
    setSyncMessage('جاري مزامنة إجاباتك مع المحرك الذكي...');
    try {
      if (dbStatusRef.current === 'online') {
        await ensureServerProfile();
      }
      const remaining: PendingResponse[] = [];
      for (const p of pendingRef.current) {
        try {
          const res = await fetch('/api/student/response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: p.studentId,
              questionId: p.questionId,
              selectedOption: p.selectedOption,
              isCorrect: p.isCorrect,
              timeTakenSeconds: p.timeTakenSeconds,
              hintUsed: p.hintUsed,
            }),
          });
          const json = await res.json();
          if (json.success) continue;
          remaining.push({ ...p, syncAttemptedAt: new Date().toISOString() });
        } catch {
          remaining.push({ ...p, syncAttemptedAt: new Date().toISOString() });
        }
      }
      setPendingQueue(remaining);
      pendingRef.current = remaining;
      storageSet(LS_PENDING, remaining);
      setSyncMessage(remaining.length === 0 ? '' : `${remaining.length} إجابة بانتظار استعادة الاتصال`);
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  }, [ensureServerProfile]);

  const answer = useCallback(
    async (selectedOption: CorrectOption, timeTakenSeconds: number, hintUsed: boolean): Promise<boolean> => {
      const sid = studentIdRef.current;
      const q = currentQuestionRef.current;
      if (!sid || !q) return false;

      const isCorrect = await recordResponseAndSync(sid, q.id, selectedOption, timeTakenSeconds, hintUsed);

      if (dbStatusRef.current === 'online') {
        await flushPending();
      } else {
        setSyncMessage(`${pendingRef.current.length} إجابات محفوظة محلياً في انتظار الاتصال`);
      }
      return isCorrect;
    },
    [recordResponseAndSync, flushPending]
  );

  const requestNext = useCallback(async (): Promise<void> => {
    const sid = studentIdRef.current;
    if (!sid) return;
    await loadNext();
    if (dbStatusRef.current === 'online') await flushPending();
  }, [loadNext, flushPending]);

  // -------------------------------------------------------------------------
  // Auto-Sync Protocol: window 'online' + server reconnection
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      if (dbStatusRef.current === 'online') {
        flushPending();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushPending]);

  useEffect(() => {
    if (databaseStatus === 'online') {
      flushPending();
      if (!currentQuestionRef.current) loadNext();
    }
  }, [databaseStatus, flushPending, loadNext]);

  return {
    studentId,
    profile,
    subjectCode,
    currentQuestion,
    pendingQueue,
    questionCache,
    answeredCount,
    sessionTarget,
    masteryByObjective,
    isStarting,
    isSyncing,
    syncMessage,
    databaseStatus,
    saveProfile,
    startSession,
    answer,
    requestNext,
    flushPending,
  };
}