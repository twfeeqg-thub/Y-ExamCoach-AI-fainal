'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, X, WifiOff, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  subscribeAdaptiveMetrics,
  readAdaptiveSessionState,
  readStoredStudentProfile,
} from '@/lib/adaptiveSession';
import { getLedger } from '@/lib/studyTracker';
import type { StudyActivityLedger } from '@/lib/studyTracker';
import { buildParentReport } from '@/lib/parentReport';
import type { AdaptiveSessionState, StudentProfile } from '@/types/index';
import ParentKpiCards from './ParentKpiCards';
import ParentMasteryBreakdown from './ParentMasteryBreakdown';
import ParentActivityLog from './ParentActivityLog';

/**
 * Parent Dashboard (Offline-First)
 *
 * Floating action button visible across all tabs; opens a full-screen
 * overlay report built purely from local storage:
 *   - aadir.study.activity            (study ledger)
 *   - aadir.adaptive.sessionState     (mastery + answered counters)
 *   - aadir.student.profile           (grade / section / subject)
 *
 * Live refresh works by subscribing to the active adaptive session metrics
 * (no second useAdaptiveSession instance is created, so the student's
 * session/sync flow is never disturbed).
 */
export const ParentDashboard: React.FC = () => {
  const { questions, databaseStatus } = useApp();

  const [open, setOpen] = useState<boolean>(false);
  const [detailed, setDetailed] = useState<boolean>(false);
  const [ledger, setLedger] = useState<StudyActivityLedger>({ responses: [], activeDays: [] });
  const [sessionState, setSessionState] = useState<AdaptiveSessionState | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Hydrate + subscribe to live session updates
  useEffect(() => {
    const refresh = () => {
      setLedger(getLedger());
      setSessionState(readAdaptiveSessionState());
      setProfile(readStoredStudentProfile());
    };

    refresh();
    const unsubscribe = subscribeAdaptiveMetrics(refresh);
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Lock page scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Objective code -> human label (unit/lesson) from the loaded question bank
  const objectiveLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      const code = q.learningObjectiveCode;
      if (code && !map[code]) map[code] = q.lesson || q.unit || code;
    }
    return map;
  }, [questions]);

  const report = useMemo(
    () => buildParentReport({ ledger, sessionState, profile }, objectiveLabels),
    [ledger, sessionState, profile, objectiveLabels]
  );

  const hasData = report.summary.totalAnswered > 0 || report.objectives.length > 0;
  const gradeLabel = profile ? (profile.grade === 12 ? 'الثاني عشر' : 'التاسع') : null;

  return (
    <>
      {/* ------------------------------------------------------------------
          Floating Action Button (visible over every tab)
      ------------------------------------------------------------------ */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="فتح لوحة تحكم أولياء الأمور"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-3 rounded-full shadow-xl shadow-blue-600/30 transition active:scale-95 min-h-[48px]"
        >
          <Users className="w-5 h-5 shrink-0" />
          <span>تقرير الأهل</span>
        </button>
      )}

      {/* ------------------------------------------------------------------
          Full-screen overlay report
      ------------------------------------------------------------------ */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-stretch md:items-center justify-center md:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="لوحة تحكم أولياء الأمور"
        >
          <div
            className="relative w-full md:max-w-3xl bg-slate-50 dark:bg-slate-950 md:rounded-3xl overflow-hidden flex flex-col max-h-full md:max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-black text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
                    لوحة تحكم أولياء الأمور
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {profile
                      ? `الصف ${gradeLabel}${profile.section ? ` • ${profile.section}` : ''}${
                          sessionState?.subjectCode ? ` • ${sessionState.subjectCode}` : ''
                        }`
                      : 'ملخص تقدم الطالب على هذا الجهاز'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Display toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={detailed}
                  onClick={() => setDetailed((v) => !v)}
                  className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 min-h-[44px] px-1"
                  title="تبديل عرض الأهداف الكامل"
                >
                  <span className="hidden sm:inline">عرض تفصيلي</span>
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      detailed ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${
                        detailed ? 'left-0.5' : 'right-0.5'
                      }`}
                    />
                  </span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق لوحة التقرير"
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              {hasData ? (
                <>
                  <ParentKpiCards summary={report.summary} />

                  <ParentActivityLog
                    streak={report.streak}
                    activeDaysCount={report.activeDaysCount}
                    recentSessions={report.recentSessions}
                  />

                  <ParentMasteryBreakdown
                    bySubject={report.bySubject}
                    objectives={report.objectives}
                    strengths={report.strengths}
                    needsWork={report.needsWork}
                    detailed={detailed}
                  />
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-4">
                  <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
                  <div className="space-y-1.5">
                    <p className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      لا توجد بيانات دراسة بعد
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      ابدأ جلسة تدريب تكيفي واحدة وسيظهر هنا تقرير مكتفٍ ذاتياً لنسبة الصحة وزمن
                      الدراسة ونقاط القوة — كل ذلك يُحفظ على هذا الجهاز دون الحاجة إنترنت.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mx-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 min-h-[44px] transition active:scale-95"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للتدريب التكيفي</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              <span className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">التقرير محفوظ على هذا الجهاز (Offline-First)</span>
              </span>
              <span className="shrink-0 flex items-center gap-1">
                {databaseStatus === 'offline' ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">وضع محلي</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">متصل</span>
                  </>
                )}
              </span>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentDashboard;