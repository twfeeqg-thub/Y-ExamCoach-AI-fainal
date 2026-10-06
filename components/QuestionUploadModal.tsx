'use client';

import React from 'react';
import { X, FileJson, Sparkles } from 'lucide-react';
import { QuestionJsonImportTab } from './QuestionJsonImportTab';

interface QuestionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (insertedCount: number) => void;
}

export const QuestionUploadModal: React.FC<QuestionUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>استيراد الأسئلة عبر كود JSON المباشر</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Supabase Direct
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                قم بلصق كود JSON أو رفع ملف لحفظه وحقنه مباشرة بجدول (smart_exam_engine.questions) دون المرور بـ n8n.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-2">
          <QuestionJsonImportTab
            onSuccess={(count) => {
              if (onSuccess) onSuccess(count);
              onClose();
            }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
