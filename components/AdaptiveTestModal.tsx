'use client';

import React from 'react';
import { X, Target } from 'lucide-react';
import { Question, CorrectOption } from '@/types/index';
import { AdaptiveQuestionCard } from './AdaptiveQuestionCard';

interface AdaptiveTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  questionIndex: number;
  onAnswered: (
    selectedOption: CorrectOption,
    timeTakenSeconds: number,
    hintUsed: boolean
  ) => Promise<void> | void;
  onNext?: () => void;
  hasAnswered?: boolean;
}

export const AdaptiveTestModal: React.FC<AdaptiveTestModalProps> = ({
  isOpen,
  onClose,
  question,
  questionIndex,
  onAnswered,
  onNext,
  hasAnswered = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-slate-100">
                جلسة الاختبار التكيفي
              </h3>
              <p className="text-[11px] text-slate-500">
                اختبار تشخيصي وتكيفي لقياس الإتقان
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="إغلاق الاختبار"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {question ? (
            <AdaptiveQuestionCard
              question={question}
              questionIndex={questionIndex}
              onAnswered={onAnswered}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="font-bold text-sm">جاري تحضير السؤال التكيفي التالي...</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {hasAnswered && onNext && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 text-sm min-h-[44px]"
            >
              <Target className="w-4 h-4" />
              <span>السؤال التالي</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveTestModal;
