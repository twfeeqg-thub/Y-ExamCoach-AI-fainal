'use client';

import React, { useState } from 'react';
import { Question } from '@/types/index';
import { useApp } from '@/context/AppContext';
import { triggerSupportToast } from '@/components/SupportToast';
import { getRandomSupportMessage } from '@/lib/psychologicalSupport';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  BarChart2,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  GraduationCap,
  Save,
  X,
  Brain,
  Layers,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface SmartQuestionCardProps {
  question: Question;
}

export const SmartQuestionCard: React.FC<SmartQuestionCardProps> = ({ question }) => {
  const { updateQuestionInStateAndServer, deleteQuestionFromStateAndServer } = useApp();

  // Accordion & Edit State
  const [showExplanations, setShowExplanations] = useState<boolean>(false);
  const [showPsychometrics, setShowPsychometrics] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Edit Form Fields
  const [editForm, setEditForm] = useState({
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC || '',
    optionD: question.optionD || '',
    correctOption: question.correctOption,
    correctExplanation: question.correctExplanation || '',
    estimatedDifficulty: question.estimatedDifficulty || 'medium',
    unit: question.unit || '',
    lesson: question.lesson || '',
  });

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const success = await updateQuestionInStateAndServer(question.id, editForm);
      if (success) {
        setIsEditing(false);

        // Trigger Psychological Support Notification
        const supportMsg = getRandomSupportMessage('questionSaved');
        triggerSupportToast({
          title: 'تم تحديث السؤال بنجاح',
          message: supportMsg,
          type: 'success',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>سهل</span>
          </span>
        );
      case 'hard':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>صعب / متقدم</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>متوسط</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 md:p-6 transition-all duration-200 shadow-sm hover:shadow-md relative space-y-4 ${
        question.isDuplicate
          ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* 1. Header Badges & Meta */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap text-xs">
          {/* Duplicate Detection Badge */}
          {question.isDuplicate && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-extrabold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>سؤال مكرر (تطابق الهاش)</span>
            </span>
          )}

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>الصف {question.grade} - {question.section}</span>
          </span>

          {question.subject && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{question.subject}</span>
            </span>
          )}

          {getDifficultyBadge(question.estimatedDifficulty)}

          {question.unit && (
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] hidden sm:inline">
              • الوحدة: {question.unit}
            </span>
          )}
        </div>

        {/* Card Control Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="تعديل السؤال"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => deleteQuestionFromStateAndServer(question.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="حذف السؤال"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Question & Options View (Mobile-First Vertical Adaptation) */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Question Scientific Text */}
          <div className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed pt-1">
            {question.questionText}
          </div>

          {/* Multiple Choice Options Grid (Mobile-First: 1 Column Full Width Tap Targets, Desktop: 2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {[
              { key: 'A', text: question.optionA },
              { key: 'B', text: question.optionB },
              { key: 'C', text: question.optionC },
              { key: 'D', text: question.optionD },
            ]
              .filter((opt) => opt.text && opt.text.trim().length > 0)
              .map((opt) => {
                const isCorrect = question.correctOption === opt.key;

                return (
                  <div
                    key={opt.key}
                    className={`p-3.5 md:p-4 rounded-2xl border flex items-center justify-between transition-all min-h-[52px] ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm md:text-base leading-snug">{opt.text}</span>
                    </div>

                    {isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Pedagogy & Bloom Badges Row (Bottom Circular Badges) */}
          <div className="flex items-center gap-2 flex-wrap pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            {/* Bloom's Taxonomy Badge */}
            <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>مستوى بلوم: فهم وتطبيق</span>
            </span>

            {/* Estimated Time Badge */}
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>الزمن المتوقع: {question.expectedTime || 60} ثانية</span>
            </span>

            {/* Source Badge */}
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>المصدر: {question.source || 'نموذج وزاري'}</span>
            </span>
          </div>

          {/* Hint if present */}
          {question.hint && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">تلميح تربوي: </span>
                <span>{question.hint}</span>
              </div>
            </div>
          )}

          {/* Explanations Accordion & Wrong Explanations Breakdown */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 min-h-[48px]"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600 shrink-0" />
                <span>الشرح التعليمي وتفنيد الإجابات الخاطئة (Wrong Explanations)</span>
              </span>
              {showExplanations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExplanations && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3.5 text-xs md:text-sm animate-in fade-in duration-200">
                {/* Correct Explanation */}
                <div className="space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تفسير الإجابة الصحيحة ({question.correctOption}):</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed pr-5">
                    {question.correctExplanation || 'لا يوجد شرح مدخل مسبقاً.'}
                  </p>
                </div>

                {/* Branched Wrong Explanations */}
                {question.wrongExplanations && Object.keys(question.wrongExplanations).length > 0 && (
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>تفنيد المشتتات والأخطاء الشائعة لدى الطلاب:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pr-2">
                      {Object.entries(question.wrongExplanations).map(([optKey, expText]) => (
                        <div
                          key={optKey}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5 text-xs"
                        >
                          <span className="w-5 h-5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black flex items-center justify-center shrink-0 mt-0.5">
                            {optKey}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {expText as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Psychometrics Accordion */}
          <div className="space-y-2">
            <button
              onClick={() => setShowPsychometrics(!showPsychometrics)}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 text-xs text-slate-600 dark:text-slate-400 font-bold transition min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>التحليل السيكومتري ومؤشرات الجودة (Item Analysis Metrics)</span>
              </span>
              {showPsychometrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPsychometrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl text-xs border border-purple-100 dark:border-purple-900/50">
                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">معامل السهولة (p-value):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {question.pValue !== null ? question.pValue : '0.68 (تقديري)'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">معامل التمييز:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {question.discriminationIndex !== null ? question.discriminationIndex : '0.45 (ممتاز)'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">الزمن المتوقع:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{question.expectedTime || 60} ثانية</span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">المصدر والسنة:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                    {question.source || 'وزاري'} ({question.examYear || 2024})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Edit Question Form */
        <div className="space-y-4 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/40 p-4 md:p-5 rounded-2xl border border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              <span>تعديل نص وخيارات السؤال</span>
            </h4>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block font-bold mb-1">نص السؤال *</label>
            <textarea
              value={editForm.questionText}
              onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
              rows={3}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">الخيار (A) *</label>
              <input
                type="text"
                value={editForm.optionA}
                onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">الخيار (B) *</label>
              <input
                type="text"
                value={editForm.optionB}
                onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">الخيار (C)</label>
              <input
                type="text"
                value={editForm.optionC}
                onChange={(e) => setEditForm({ ...editForm, optionC: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">الخيار (D)</label>
              <input
                type="text"
                value={editForm.optionD}
                onChange={(e) => setEditForm({ ...editForm, optionD: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">الخيار الصحيح *</label>
              <select
                value={editForm.correctOption}
                onChange={(e) => setEditForm({ ...editForm, correctOption: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              >
                <option value="A">الخيار A</option>
                <option value="B">الخيار B</option>
                <option value="C">الخيار C</option>
                <option value="D">الخيار D</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">مستوى الصعوبة</label>
              <select
                value={editForm.estimatedDifficulty}
                onChange={(e) => setEditForm({ ...editForm, estimatedDifficulty: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
              >
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">الشرح والتفسير التربوي</label>
            <textarea
              value={editForm.correctExplanation}
              onChange={(e) => setEditForm({ ...editForm, correctExplanation: e.target.value })}
              rows={2}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartQuestionCard;
