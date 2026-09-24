'use client';

import React from 'react';
import { Flame, History } from 'lucide-react';
import { RecentSession, formatStudyTime } from '@/lib/parentReport';

interface ParentActivityLogProps {
  streak: number;
  activeDaysCount: number;
  recentSessions: RecentSession[];
}

/**
 * Study activity & regularity: active-days streak indicator plus a summary
 * of the most recent adaptive sessions.
 */
export const ParentActivityLog: React.FC<ParentActivityLogProps> = ({
  streak,
  activeDaysCount,
  recentSessions,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {/* Streak card */}
      <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm p-4 md:p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-100">
          <Flame className="w-4 h-4 shrink-0" />
          <span>أيام الدراسة المتتالية</span>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-black leading-none">{streak}</p>
          <p className="text-sm font-bold text-orange-100 pb-0.5">أيام</p>
        </div>
        <p className="text-[11px] text-orange-100/90 font-medium">
          {activeDaysCount} يوماً نشطاً إجمالاً حتى الآن
        </p>
      </div>

      {/* Recent sessions */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm md:text-base font-extrabold text-slate-900 dark:text-slate-100">
          <History className="w-4 h-4 text-blue-600 shrink-0" />
          <span>آخر الجلسات</span>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            لا توجد جلسات بعد — ستُعرض هنا خلاصة الجلسات الأخيرة.
          </p>
        ) : (
          <div className="space-y-2">
            {recentSessions.slice(0, 3).map((session, i) => (
              <div
                key={`${session.startAt}-${i}`}
                className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-black text-slate-700 dark:text-slate-200 shrink-0">
                    {session.dayLabel}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 truncate">{session.subject}</span>
                </div>
                <div className="flex items-center gap-3 font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  <span>{session.answered} سؤالاً</span>
                  {session.accuracy !== null && (
                    <span
                      className={
                        session.accuracy >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : session.accuracy >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      صحة {session.accuracy}%
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                    {formatStudyTime(session.studySeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentActivityLog;