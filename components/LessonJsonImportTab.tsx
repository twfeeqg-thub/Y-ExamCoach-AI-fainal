'use client';

import React, { useState } from 'react';
import { Lesson, LessonInput } from '@/types/index';
import { validateLessonList } from '@/lib/lessonValidator';
import { triggerSupportToast } from './SupportToast';
import { saveLessonsLocally } from '@/lib/lessonStore';
import {
  FileCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';

interface LessonJsonImportTabProps {
  onSuccess?: (lessons: Lesson[]) => void;
}

export const LessonJsonImportTab: React.FC<LessonJsonImportTabProps> = ({ onSuccess }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedLessons, setParsedLessons] = useState<LessonInput[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleJsonChange = (text: string) => {
    setJsonInput(text);
    if (!text.trim()) {
      setParsedLessons([]);
      setValidationErrors([]);
      return;
    }

    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      }
      const parsed = JSON.parse(cleaned);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const result = validateLessonList(items);
      if (result.validLessons.length > 0) {
        setParsedLessons(result.validLessons);
        setValidationErrors(result.errors);
      }
    } catch {
      // Typing in progress
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      handleJsonChange(text);
    };
    reader.readAsText(file);
  };

  const handleSaveAndPublish = async () => {
    let lessonsToSave = parsedLessons;

    if (lessonsToSave.length === 0) {
      if (!jsonInput.trim()) {
        triggerSupportToast({
          title: 'تنبيه',
          message: 'يرجى إدخال أو لصق كود JSON للدرس أولاً.',
          type: 'warning',
        });
        return;
      }

      try {
        let cleaned = jsonInput.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
        }
        const parsed = JSON.parse(cleaned);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const result = validateLessonList(items);
        if (result.validLessons.length === 0) {
          triggerSupportToast({
            title: 'خطأ في التحقق من بنية JSON',
            message: result.errors.join('; ') || 'لم يتم العثور على دروس صالحة.',
            type: 'error',
          });
          return;
        }
        lessonsToSave = result.validLessons;
        setParsedLessons(lessonsToSave);
      } catch (err: any) {
        triggerSupportToast({
          title: 'صيغة JSON غير صالحة',
          message: err.message || 'تأكد من صحة علامات الاقتباس والأقواس في ملف الـ JSON.',
          type: 'error',
        });
        return;
      }
    }

    setIsSubmitting(true);
    triggerSupportToast({
      title: 'جاري الحفظ في السحابة... ⏳',
      message: `يتم الآن إرسال ${lessonsToSave.length} درس إلى جدول smart_exam_engine.lessons...`,
      type: 'processing',
    });

    try {
      // Explicit fetch POST to /api/lessons
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: lessonsToSave }),
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.lessons)) {
        saveLessonsLocally(data.lessons);
        triggerSupportToast({
          title: 'تم حفظ ونشر الدرس بنجاح 🟢',
          message: data.message || `تم بنجاح حفظ ونشر ${data.lessons.length} درس في جدول smart_exam_engine.lessons.`,
          type: 'success',
        });
        if (onSuccess) onSuccess(data.lessons);
      } else {
        const errorMsg = data.error || (data.details ? JSON.stringify(data.details) : 'فشل الحفظ في قاعدة البيانات');
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('[LessonJsonImportTab] Save failed:', err);
      triggerSupportToast({
        title: 'فشل حفظ ونشر الدرس في السحابة 🔴',
        message: err.message || 'حدث خطأ في الخادم أثناء محاولة حفظ الدرس في جدول smart_exam_engine.lessons.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">
              استيراد الدروس عبر كود JSON المباشر
            </h3>
            <p className="text-xs text-slate-500">
              قم بلصق محتوى JSON أو رفع ملف لحفظه مباشرة في جدول smart_exam_engine.lessons
            </p>
          </div>
        </div>

        <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition">
          <Upload className="w-4 h-4" />
          <span>رفع ملف JSON</span>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          كود JSON للدرس أو الدروس:
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder={`{\n  "grade": 12,\n  "subject": "الرياضيات",\n  "unit_title": "التفاضل والتكامل",\n  "lesson_title": "نهايات الدوال المثلثية",\n  "content_json": {\n    "introduction": "مقدمة عن النهايات...",\n    "coreConcepts": []\n  }\n}`}
          rows={12}
          dir="ltr"
          className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
        />
      </div>

      {validationErrors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>ملاحظات التحقق:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pr-2">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {parsedLessons.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              جاهز للحفظ: تم التحقق بنجاح من {parsedLessons.length} درس.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setJsonInput('');
              setParsedLessons([]);
              setValidationErrors([]);
            }}
            className="text-slate-400 hover:text-rose-500 transition"
            title="مسح الحقل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          disabled={isSubmitting || !jsonInput.trim()}
          onClick={handleSaveAndPublish}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الحفظ والنشر بالسحابة...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {parsedLessons.length > 1
                  ? `حفظ ونشر (${parsedLessons.length}) درس`
                  : 'حفظ ونشر الدرس'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LessonJsonImportTab;
