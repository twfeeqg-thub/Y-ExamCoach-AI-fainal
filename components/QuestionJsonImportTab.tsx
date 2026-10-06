'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { triggerSupportToast } from './SupportToast';
import {
  FileCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Wrench,
  Database,
  FileJson,
} from 'lucide-react';

export const SAMPLE_QUESTIONS_PAYLOAD = JSON.stringify(
  [
    {
      question_text: "ما هو ناتج اشتقاق الدالة f(x) = sin(3x) بالنسبة للمتغير x؟",
      question_type: "multiple_choice",
      option_a: "3 cos(3x)",
      option_b: "-3 cos(3x)",
      option_c: "cos(3x)",
      option_d: "3 sin(3x)",
      correct_option: "A",
      correct_explanation: "باستخدام قاعدة السلسلة: مشتقة sin(u) هي u' cos(u)، ومشتقة 3x هي 3، فيكون الناتج 3 cos(3x).",
      wrong_explanations: {
        B: "إجابة خاطئة؛ إشارة السالب تظهر عند اشتقاق جيب التمام وليس الجيب.",
        C: "إجابة خاطئة؛ تم نسيان ضرب المشتقة في معامل الزاوية الداخلية (3).",
        D: "إجابة خاطئة؛ مشتقة الجيب تتحول إلى جيب التمام cos."
      },
      subject: "الرياضيات",
      grade: 12,
      section: "علمي",
      unit: "التفاضل والتكامل",
      lesson: "قواعد الاشتقاق",
      learning_objective_code: "MATH-12-CALC-01",
      bloom_taxonomy: "تطبيق",
      estimated_difficulty: "medium",
      expected_time: 60,
      source: "الامتحان الوزاري الموحد 2024",
      assessment_context: "summative",
      repetition_count: 1,
      exam_years: [2024]
    }
  ],
  null,
  2
);

interface QuestionJsonImportTabProps {
  onSuccess?: (insertedCount: number) => void;
  onClose?: () => void;
}

export const QuestionJsonImportTab: React.FC<QuestionJsonImportTabProps> = ({
  onSuccess,
  onClose,
}) => {
  const { refreshData } = useApp();
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Parse and validate locally
  const parseLocalJson = (text: string): any[] | null => {
    if (!text.trim()) {
      setValidationError('يرجى إدخال كود JSON أو رفع ملف يحتوي على مصفوفة الأسئلة.');
      return null;
    }

    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (syntaxErr: any) {
      setValidationError(`خطأ في صياغة JSON: ${syntaxErr.message}`);
      return null;
    }

    let questionsList: any[] = [];
    if (Array.isArray(parsed)) {
      questionsList = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      questionsList = parsed.questions;
    } else if (parsed && typeof parsed === 'object') {
      questionsList = [parsed];
    }

    if (questionsList.length === 0) {
      setValidationError('لم يتم العثور على أي أسئلة داخل كائن أو مصفوفة الـ JSON.');
      return null;
    }

    setValidationError(null);
    setParsedCount(questionsList.length);
    return questionsList;
  };

  const handleJsonInputChange = (text: string) => {
    setJsonInput(text);
    if (!text.trim()) {
      setParsedCount(0);
      setValidationError(null);
      return;
    }

    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      }
      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed) ? parsed : parsed.questions ? parsed.questions : [parsed];
      setParsedCount(list.length);
      setValidationError(null);
    } catch {
      // Typing in progress, do not show fatal error yet
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setJsonInput(text);
      parseLocalJson(text);
    };
    reader.readAsText(file);
  };

  const handleApplySample = () => {
    setJsonInput(SAMPLE_QUESTIONS_PAYLOAD);
    setValidationError(null);
    setParsedCount(1);
    triggerSupportToast({
      title: 'تم إدراج نموذج وزاري جاهز',
      message: 'النموذج يتوافق مع كامل حقول جدول smart_exam_engine.questions الصارمة.',
      type: 'info',
    });
  };

  const handleFormatAndFix = () => {
    if (!jsonInput.trim()) {
      setValidationError('يرجى لصق نص JSON أولاً ليتم فحصه وتنسيقه.');
      return;
    }

    try {
      let cleaned = jsonInput.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      }
      const parsed = JSON.parse(cleaned);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setValidationError(null);
      triggerSupportToast({
        title: 'كود JSON سليم ومتناسق ✅',
        message: 'تم التحقق من الصيغة وتنسيق الكود بنجاح.',
        type: 'success',
      });
    } catch (err: any) {
      setValidationError(`خطأ نحوي في بنية JSON: ${err.message}`);
      triggerSupportToast({
        title: 'خطأ في بنية JSON 🔴',
        message: err.message,
        type: 'error',
      });
    }
  };

  const handleDirectInject = async () => {
    const questionsToInject = parseLocalJson(jsonInput);
    if (!questionsToInject || questionsToInject.length === 0) {
      triggerSupportToast({
        title: 'بيانات غير صالحة 🔴',
        message: validationError || 'يرجى التأكد من صحة كود JSON للأسئلة.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Direct POST to /api/questions for immediate insertion into smart_exam_engine.questions (NO n8n)
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsToInject }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.fieldError || `فشل إدراج الأسئلة في قاعدة البيانات (${res.status})`;
        setValidationError(errorMsg);
        triggerSupportToast({
          title: 'فشل الحقن في قاعدة البيانات 🔴',
          message: errorMsg,
          type: 'error',
        });
        return;
      }

      const insertedCount = data.count || (Array.isArray(data.data) ? data.data.length : 1);

      // Explicit Toast Notification of success
      triggerSupportToast({
        title: 'تم الحقن المباشر في Supabase بنجاح 🚀',
        message: `تم بنجاح حفظ وحقن ${insertedCount} سؤال في جدول (smart_exam_engine.questions) في Supabase!`,
        type: 'success',
      });

      await refreshData();

      if (onSuccess) {
        onSuccess(insertedCount);
      }
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Error during direct question injection:', err);
      const errorMsg = err.message || 'حدث خطأ غير متوقع أثناء الاتصال بـ Supabase';
      setValidationError(errorMsg);
      triggerSupportToast({
        title: 'فشل الاتصال 🔴',
        message: errorMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs md:text-sm text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">الحقن السحابي المباشر (Supabase Direct Insert):</span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              يتم إرسال كود JSON مباشرة إلى جدول <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded font-mono">smart_exam_engine.questions</code> دون المرور بـ n8n.
            </p>
          </div>
        </div>

        {parsedCount > 0 && (
          <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-xl text-xs shrink-0 shadow-sm">
            {parsedCount} أسئلة مكتشفة
          </span>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-300 dark:border-slate-600 transition flex items-center gap-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>رفع ملف JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleApplySample}
            className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إدراج نموذج تجريبي</span>
          </button>

          <button
            type="button"
            onClick={handleFormatAndFix}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>فحص وتنسيق</span>
          </button>
        </div>

        {jsonInput && (
          <button
            type="button"
            onClick={() => {
              setJsonInput('');
              setParsedCount(0);
              setValidationError(null);
            }}
            className="text-slate-500 hover:text-rose-600 px-2 py-1 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>مسح المحتوى</span>
          </button>
        )}
      </div>

      {/* Prominent Error Banner */}
      {validationError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">خطأ في التحقق من بنية JSON: </span>
            <span className="font-mono text-[11px] block mt-0.5">{validationError}</span>
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={jsonInput}
          onChange={(e) => handleJsonInputChange(e.target.value)}
          placeholder={`ألصق كود JSON للأسئلة هنا (مصفوفة أو كائن). مثال:\n[\n  {\n    "question_text": "...",\n    "option_a": "...",\n    "option_b": "...",\n    "correct_option": "A",\n    "correct_explanation": "...",\n    "subject": "الرياضيات",\n    "grade": 12,\n    "section": "علمي",\n    "unit": "الوحدة 1",\n    "lesson": "الدرس 1"\n  }\n]`}
          rows={12}
          className="w-full p-4 font-mono text-xs md:text-sm bg-slate-900 text-emerald-400 dark:bg-black rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-y leading-relaxed"
          dir="ltr"
        />
      </div>

      {/* Submit / Inject Button */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {parsedCount > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              جاهز لحقن {parsedCount} سؤال مباشرة في قاعدة البيانات
            </span>
          ) : (
            <span>قم بلصق الكود واضغط حقن مباشر للكتابة في Supabase</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDirectInject}
          disabled={isSubmitting || !jsonInput.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الحقن في Supabase...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>حقن مباشر في Supabase ({parsedCount || '0'})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
