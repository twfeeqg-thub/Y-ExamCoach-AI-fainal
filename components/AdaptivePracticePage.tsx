'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAdaptiveSession } from '@/lib/adaptiveSession';
import { AdaptiveQuestionCard } from './AdaptiveQuestionCard';
import { useApp } from '@/context/AppContext';
import { Trophy, CloudUpload, WifiOff, Target, RefreshCw, Play, CheckCircle2, Brain, BarChart3 } from 'lucide-react';
import { Section, Grade } from '@/types/index';

const SUBJECTS = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'];

const SUBJECT_DIFFICULTY_BINDING_CLASS = 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm min-h-[44px] w-full';

export const AdaptivePracticePage: React.FC = () => {
  const { databaseStatus } = useApp();
  const {
    studentId,
    profile,
    subjectCode,
    currentQuestion,
    answeredCount,
    sessionTarget,
    masteryByObjective,
    isStarting,
    isSyncing,
    syncMessage,
    pendingQueue,
    saveProfile,
    startSession,
    answer,
    requestNext,
  } = useAdaptiveSession();

  const [setupGrade, setSetupGrade] = useState<Grade>(12);
  const [setupSubject, setSetupSubject] = useState<string>(SUBJECTS[0]);
  const [setupSection, setSetupSection] = useState<string>('');
  const [setupGovernorate, setSetupGovernorate] = useState<string>('');
  const [showNext, setShowNext] = useState<boolean>(false);
  const startedRef = useRef<boolean>(false);

  // Start the session automatically once the student is known
  useEffect(() => {
    if (startedRef.current) return;
    if (!studentId) return;
    startedRef.current = true;
    const target = profile?.targetSubject || setupSubject;
    startSession(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, profile?.targetSubject]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile({
      grade: setupGrade,
      section: (setupSection as Section) || null,
      governorate: setupGovernorate || null,
      targetSubject: setupSubject,
    });
    startedRef.current = false;
    startSession(setupSubject);
  };

  const handleAnswered = async (opt: any, timeTaken: number, hintUsed: boolean) => {
    if (!currentQuestion) return;
    await answer(opt, timeTaken, hintUsed);
    setShowNext(true);
  };

  const handleNext = async () => {
    setShowNext(false);
    await requestNext();
  };

  // Mastery score bars (per objective encountered during this session)
  const objectiveEntries = Object.entries(masteryByObjective);
  const averageMastery =
    objectiveEntries.length > 0
      ? Math.round(objectiveEntries.reduce((sum, [, m]) => sum + m.masteryScore, 0) / objectiveEntries.length)
      : 0;

  const progressPercent = Math.min(100, Math.round((answeredCount / sessionTarget) * 100));

  // ---------------------------------------------------------------------------
  // 1. Student Setup Prompt (first run)
  // ---------------------------------------------------------------------------
  if (!profile) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-blue-600 shrink-0" />
              <span>ابدأ جلسة التدريب التكيفي</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1.5">
              حتى لو كنت تبدأ من الصفر، المحرك سيوصي لك بالسؤال الأنسب لمستوى إتقانك الحالي.
            </p>
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-4 text-xs md:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">الصف الدراسي</label>
                <select
                  value={setupGrade}
                  onChange={(e) => setSetupGrade(Number(e.target.value) as Grade)}
                  className={SUBJECT_DIFFICULTY_BINDING_CLASS}
                >
                  <option value={9}>الصف التاسع</option>
                  <option value={12}>الصف الثاني عشر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">المادة المستهدفة</label>
                <select
                  value={setupSubject}
                  onChange={(e) => setSetupSubject(e.target.value)}
                  className={SUBJECT_DIFFICULTY_BINDING_CLASS}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">الشعبة (اختياري)</label>
                <select
                  value={setupSection}
                  onChange={(e) => setSetupSection(e.target.value)}
                  className={SUBJECT_DIFFICULTY_BINDING_CLASS}
                >
                  <option value="">غير محدد</option>
                  <option value="علمي">علمي</option>
                  <option value="أدبي">أدبي</option>
                  <option value="تجاري">تجاري</option>
                  <option value="شرعي">شرعي</option>
                  <option value="أساسي">أساسي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">المحافظة (اختياري)</label>
                <input
                  type="text"
                  value={setupGovernorate}
                  onChange={(e) => setSetupGovernorate(e.target.value)}
                  placeholder="مثال: صنعاء - عدن - تعز"
                  className={SUBJECT_DIFFICULTY_BINDING_CLASS}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 min-h-[44px]"
            >
              <Play className="w-4 h-4" />
              <span>بدء الجلسة الآن</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Loading State
  // ---------------------------------------------------------------------------
  if (isStarting) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center">
        <div className="w-14 h-14 rounded-3xl bg-blue-600/10 flex items-center justify-center animate-pulse">
          <Brain className="w-7 h-7 text-blue-600 animate-pulse" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-bold">
          جاري تحليل مستوى إتقانك واختيار السؤال الأمثل...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Session Complete
  // ---------------------------------------------------------------------------
  if (!currentQuestion && answeredCount > 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-5 text-center">
          <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            اكتملت الحصة التدريبية! 🎉
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            أجبت على <strong className="text-slate-900 dark:text-slate-100">{answeredCount}</strong> سؤالاً.
            {pendingQueue.length > 0 && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                {pendingQueue.length} إجابات في انتظار المزامنة.
              </span>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">معدل الإتقان</span>
              <span className="block text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{averageMastery}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">الأهداف المتتبعة</span>
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{objectiveEntries.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">المادة</span>
              <span className="block text-lg font-black text-purple-600 dark:text-purple-400 mt-2">{subjectCode}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              startSession(subjectCode);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 mx-auto min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>جلسة جديدة</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Practice Session In-Progress
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
      {/* Session Header: Progress + Sync status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">{(profile.grade === 12 ? '12' : '9')}</span>
            <div>
              <p className="font-bold">{subjectCode}</p>
              <p className="text-[11px] text-slate-400 font-medium">{profile.section || 'غير محدد الشعبة'} • حصة تدريب تكيفي</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {isSyncing ? (
              <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                <CloudUpload className="w-4 h-4 animate-pulse" />
                <span>{syncMessage || 'جارٍ المزامنة...'}</span>
              </span>
            ) : databaseStatus === 'offline' || pendingQueue.length > 0 ? (
              <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span>{syncMessage || `${pendingQueue.length} إجابات محفوظة محلياً`}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>متصل ومتزامن</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>تقدّم الحصة</span>
            </span>
            <span className="font-mono">
              {answeredCount} / {sessionTarget} ({progressPercent}%)
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mastery Score Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>مؤشر الإتقان اللحظي (Mastery Score)</span>
            </span>
            <span className="font-mono">{objectiveEntries.length === 0 ? '—' : `${averageMastery}%`}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                averageMastery >= 80
                  ? 'bg-emerald-500'
                  : averageMastery >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${objectiveEntries.length === 0 ? 0 : averageMastery}%` }}
            />
          </div>

          {objectiveEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {objectiveEntries.map(([code, m]) => (
                <span
                  key={code}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300"
                >
                  {code}: {Math.round(m.masteryScore)}%
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Question Card */}
      {currentQuestion && (
        <>
          <AdaptiveQuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            questionIndex={answeredCount + 1}
            onAnswered={handleAnswered}
          />

          {showNext && (
            <div className="flex justify-end animate-in slide-in-from-bottom-3 fade-in duration-200">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 min-h-[44px]"
              >
                <Target className="w-4 h-4" />
                <span>السؤال التالي</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* No question available yet */}
      {!currentQuestion && answeredCount === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 space-y-3">
          <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-bold">لا توجد أسئلة متاحة بعد لهذه المادة. أضف أسئلة إلى بنك الأسئلة أولاً.</p>
          <button
            type="button"
            onClick={() => {
              startedRef.current = false;
              startSession(subjectCode);
            }}
            className="mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdaptivePracticePage;