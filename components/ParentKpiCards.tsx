'use client';

import React from 'react';
import { ListChecks, Clock, Target } from 'lucide-react';
import { ParentSummary } from '@/lib/parentReport';
import ParentProgressBar from './ParentProgressBar';

interface ParentKpiCardsProps {
  summary: ParentSummary;
}

/**
 * Key indicator cards: solved questions + accuracy, total study time,
 * and overall (weighted) mastery rate.
 */
export const ParentKpiCards: React.FC<ParentKpiCardsProps> = ({ summary }) => {
  const hasActivity =
    summary.totalAnswered > 0 || (summary.overallMastery ?? null) !== null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {/* Card 1: Solved questions & accuracy */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
          <span>الأسئلة المحلولة</span>
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
          {hasActivity ? summary.totalAnswered : '—'}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>نسبة الإجابات الصحيحة</span>
            <span className="font-mono">{summary.accuracy !== null ? `${summary.accuracy}%` : '—'}</span>
          </div>
          <ParentProgressBar value={summary.accuracy ?? 0} />
        </div>
      </div>

      {/* Card 2: Total study time */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4 text-violet-600 shrink-0" />
          <span>زمن الدراسة الفعلي</span>
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
          {summary.totalStudySeconds > 0 ? summary.studyTimeLabel : '—'}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          إجمالي الوقت عبر جميع الجلسات
        </p>
      </div>

      {/* Card 3: Overall mastery */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Target className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>معدل الإتقان العام</span>
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
          {summary.overallMastery !== null ? `${summary.overallMastery}%` : '—'}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>موزّن حسب عدد المحاولات</span>
            <span className="font-mono">{summary.trackedObjectives} هدف</span>
          </div>
          <ParentProgressBar value={summary.overallMastery ?? 0} />
        </div>
      </div>
    </div>
  );
};

export default ParentKpiCards;