'use client';

import React from 'react';
import { CheckCircle2, TrendingDown, TrendingUp, BookOpen } from 'lucide-react';
import {
  ObjectiveMasterySummary,
  SubjectMastery,
} from '@/lib/parentReport';
import ParentProgressBar from './ParentProgressBar';

interface ParentMasteryBreakdownProps {
  bySubject: SubjectMastery[];
  objectives: ObjectiveMasterySummary[];
  strengths: string[];
  needsWork: string[];
  detailed: boolean;
}

const LEVEL_META = {
  mastered: { label: 'متقن', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' },
  progressing: { label: 'يسير جيداً', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' },
  'needs-work': { label: 'يحتاج مراجعة', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' },
  'no-data': { label: 'بدون بيانات', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
} as const;

/**
 * Subject & learning-objective mastery breakdown, plus caregiver-friendly
 * highlight boxes for strengths and topics needing reinforcement.
 */
export const ParentMasteryBreakdown: React.FC<ParentMasteryBreakdownProps> = ({
  bySubject,
  objectives,
  strengths,
  needsWork,
  detailed,
}) => {
  const visibleObjectives = detailed ? objectives : objectives.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Subject mastery bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>الإتقان حسب المواد</span>
          </h3>
          {detailed && objectives.length > 0 && (
            <span className="text-[11px] font-bold text-slate-400">{objectives.length} هدفاً متتبعاً</span>
          )}
        </div>

        {bySubject.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium py-2">
            لا توجد بيانات إتقان بعد — ابدأ جلسة تدريب تكيفي ليتكوّن التقرير تلقائياً.
          </p>
        ) : (
          <div className="space-y-3">
            {bySubject.map((subject) => (
              <div key={subject.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{subject.subject}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {subject.averageMastery !== null ? `${subject.averageMastery}%` : '—'}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                    {subject.attempts} سؤالاً
                  </span>
                </div>
                <ParentProgressBar value={subject.averageMastery ?? 0} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning objectives */}
      {visibleObjectives.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-4 md:p-5 space-y-3">
          <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-slate-100">
            تفصيل الأهداف التعليمية
          </h3>
          <div className="space-y-2.5">
            {visibleObjectives.map((obj) => (
              <div key={obj.code} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 min-w-0">
                    <span className="truncate">{obj.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${LEVEL_META[obj.level].cls}`}
                    >
                      {LEVEL_META[obj.level].label}
                    </span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {obj.score !== null ? `${obj.score}%` : '—'}
                  </span>
                </div>
                <ParentProgressBar value={obj.score ?? 0} />
              </div>
            ))}
          </div>
          {!detailed && objectives.length > visibleObjectives.length && (
            <p className="text-[11px] text-slate-400 font-bold">
              +{objectives.length - visibleObjectives.length} أهداف أخرى…
            </p>
          )}
        </div>
      )}

      {/* Strengths & reinforcement boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>نقاط القوة</span>
          </div>
          {strengths.length === 0 ? (
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70 font-medium">
              ستبدأ النقاط الإيجابية في الظهور هنا مع تقدّم ابنك/ابنتك في الإتقان.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {strengths.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-rose-800 dark:text-rose-300">
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span>يحتاج إلى تقوية</span>
          </div>
          {needsWork.length === 0 ? (
            <p className="text-xs text-rose-700/80 dark:text-rose-300/70 font-medium">
              ممتاز! لا توجد مواضيع بحاجة إلى تقوية حالياً. 🎉
            </p>
          ) : (
            <ul className="space-y-1.5">
              {needsWork.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-rose-900 dark:text-rose-100 font-medium leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentMasteryBreakdown;