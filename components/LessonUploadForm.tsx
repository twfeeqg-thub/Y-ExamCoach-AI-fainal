'use client';

import React, { useState } from 'react';
import {
  Lesson,
  LessonInput,
  Grade,
  Section,
  CoreConcept,
  SolvedExample,
  MediaResource,
} from '@/types/index';
import { validateLessonInput, validateLessonList } from '@/lib/lessonValidator';
import { addOrUpdateLocalLesson, saveLessonsLocally } from '@/lib/lessonStore';
import { MathText } from './MathText';
import { triggerSupportToast } from './SupportToast';
import {
  FileText,
  Code,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  UploadCloud,
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  Video,
  FileDown,
  X,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';

interface LessonUploadFormProps {
  onSuccess?: (savedLessons: Lesson[]) => void;
  onCancel?: () => void;
  initialLesson?: Lesson | null;
}

const SAMPLE_NOTEBOOK_JSON = JSON.stringify(
  [
    {
      grade: 12,
      section: 'علمي',
      subject: 'الكيمياء',
      unitTitle: 'الاتزان الكيميائي',
      unitOrder: 2,
      lessonTitle: 'قاعدة لوشاتيليه والعوامل المؤثرة على الاتزان',
      lessonOrder: 1,
      learningObjectiveCodes: ['CHEM-12-EQ-01', 'CHEM-12-EQ-02'],
      estimatedReadingTimeMinutes: 10,
      content: {
        introduction:
          'عندما يتعرض نظام كيميائي متزن لمؤثر خارجي يغير من تركيز أو ضغط أو درجة حرارة النظام، فإن التفاعل ينشط في الاتجاه الذي يقلل من هذا المؤثر للوصول إلى حالة اتزان جديدة.',
        coreConcepts: [
          {
            conceptTitle: 'تأثير تغير التراكيز',
            explanation:
              'إضافة مادة متفاعلة تزاح الاتزان نحو النواتج (طردي). بينما إضافة ناتج تزاح الاتزان نحو المتفاعلات (عكسي). قيمة ثابت الاتزان $K_{eq}$ تظل ثابتة.',
            keyTakeaway: 'تغير التراكيز يغير موضع الاتزان فقط ولا يغير قيمة ثابت الاتزان.'
          },
          {
            conceptTitle: 'تأثير درجة الحرارة',
            explanation:
              'في التفاعلات الطاردة للحرارة ($\Delta H < 0$): زيادة الحرارة تزاح الاتزان عكسياً وتقل قيمة $K_{eq}$. في التفاعلات الماصة ($\Delta H > 0$): زيادة الحرارة تزاح الاتزان طردياً وتزداد قيمة $K_{eq}$.',
            keyTakeaway: 'درجة الحرارة هي العامل الوحيد القادر على تغيير قيمة ثابت الاتزان $K_{eq}$.'
          }
        ],
        commonMistakes: [
          'الاعتقاد بأن العامل الحفاز يغير موضع الاتزان أو قيمة $K_{eq}$ (هو يسرع الوصول للاتزان فقط).',
          'افتراض أن زيادة الضغط تفضل دائماً الاتجاه الطردي دون عد مولات الغازات في الطرفين.'
        ],
        solvedExamples: [
          {
            exampleText:
              'في التفاعل الغازي المتزن: $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g) + \\text{Heat}$، ما أثر زيادة الضغط على موضع الاتزان؟',
            stepByStepSolution:
              '1) حساب عدد مولات الغازات في الطرفين:\n• المتفاعلات: $1 + 3 = 4\\text{ mol}$\n• النواتج: $2\\text{ mol}$\n2) زيادة الضغط تجعل النظام يفضل الاتجاه ذي الحجم الأقل (المولات الأقل).\n3) إذن يزاح موضع الاتزان نحو اليمين (الاتجاه الطردي).',
            finalAnswer: 'ينشط التفاعل في الاتجاه الطردي نحو تكوين المزيد من النشادر $\\text{NH}_3$.'
          }
        ],
        activeRecallSummary:
          'سؤال التثبيت السريع: ما العامل الوحيد الذي يؤثر على قيمة ثابت الاتزان $K_{eq}$؟ الإجابة: درجة الحرارة فقط.'
      },
      mediaResources: {
        audio: [],
        video: [
          {
            sourceType: 'youtube_url',
            url: 'https://youtube.com/watch?v=sampleLeChatelier',
            title: 'شرح تجربة تأثير الضغط والحرارة على الاتزان'
          }
        ],
        attachments: []
      }
    }
  ],
  null,
  2
);

export const LessonUploadForm: React.FC<LessonUploadFormProps> = ({
  onSuccess,
  onCancel,
  initialLesson,
}) => {
  const [activeMode, setActiveMode] = useState<'json' | 'manual'>(
    initialLesson ? 'manual' : 'json'
  );

  // --- JSON Mode State ---
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonParsedLessons, setJsonParsedLessons] = useState<LessonInput[]>([]);
  const [jsonValidationErrors, setJsonValidationErrors] = useState<string[]>([]);
  const [isParsingJson, setIsParsingJson] = useState<boolean>(false);
  const [isSubmittingJson, setIsSubmittingJson] = useState<boolean>(false);

  // --- Manual Mode State ---
  const [grade, setGrade] = useState<Grade>(initialLesson?.grade || 12);
  const [section, setSection] = useState<string>(initialLesson?.section || 'علمي');
  const [subject, setSubject] = useState<string>(initialLesson?.subject || 'الرياضيات');
  const [unitTitle, setUnitTitle] = useState<string>(initialLesson?.unitTitle || '');
  const [unitOrder, setUnitOrder] = useState<number>(initialLesson?.unitOrder || 1);
  const [lessonTitle, setLessonTitle] = useState<string>(initialLesson?.lessonTitle || '');
  const [lessonOrder, setLessonOrder] = useState<number>(initialLesson?.lessonOrder || 1);
  const [learningObjectiveCodes, setLearningObjectiveCodes] = useState<string>(
    initialLesson?.learningObjectiveCodes?.join(', ') || ''
  );
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<number>(
    initialLesson?.estimatedReadingTimeMinutes || 10
  );

  // Content
  const [introduction, setIntroduction] = useState<string>(
    initialLesson?.content?.introduction || ''
  );
  const [coreConcepts, setCoreConcepts] = useState<CoreConcept[]>(
    initialLesson?.content?.coreConcepts || [
      { conceptTitle: '', explanation: '', keyTakeaway: '' },
    ]
  );
  const [commonMistakes, setCommonMistakes] = useState<string[]>(
    initialLesson?.content?.commonMistakes || ['']
  );
  const [solvedExamples, setSolvedExamples] = useState<SolvedExample[]>(
    initialLesson?.content?.solvedExamples || [
      { exampleText: '', stepByStepSolution: '', finalAnswer: '' },
    ]
  );
  const [activeRecallSummary, setActiveRecallSummary] = useState<string>(
    initialLesson?.content?.activeRecallSummary || ''
  );

  // Media
  const [mediaResources, setMediaResources] = useState<MediaResource[]>(
    initialLesson
      ? [
          ...(initialLesson.mediaResources.video || []),
          ...(initialLesson.mediaResources.audio || []),
          ...(initialLesson.mediaResources.attachments || []),
        ]
      : []
  );

  // Live KaTeX preview toggle for manual editor
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [isSavingManual, setIsSavingManual] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // JSON Mode Handlers & Form State Hydration
  // ---------------------------------------------------------------------------

  const applyJsonToFormState = (lesson: LessonInput) => {
    if (lesson.grade) setGrade(lesson.grade);
    if (lesson.section) setSection(lesson.section);
    if (lesson.subject) setSubject(lesson.subject);
    if (lesson.unitTitle) setUnitTitle(lesson.unitTitle);
    if (lesson.unitOrder) setUnitOrder(lesson.unitOrder);
    if (lesson.lessonTitle) setLessonTitle(lesson.lessonTitle);
    if (lesson.lessonOrder) setLessonOrder(lesson.lessonOrder);
    if (lesson.learningObjectiveCodes && lesson.learningObjectiveCodes.length > 0) {
      setLearningObjectiveCodes(lesson.learningObjectiveCodes.join(', '));
    }
    if (lesson.estimatedReadingTimeMinutes) {
      setEstimatedReadingTime(lesson.estimatedReadingTimeMinutes);
    }
    if (lesson.content) {
      if (lesson.content.introduction !== undefined) {
        setIntroduction(lesson.content.introduction);
      }
      if (Array.isArray(lesson.content.coreConcepts) && lesson.content.coreConcepts.length > 0) {
        setCoreConcepts(lesson.content.coreConcepts);
      }
      if (Array.isArray(lesson.content.commonMistakes) && lesson.content.commonMistakes.length > 0) {
        setCommonMistakes(lesson.content.commonMistakes);
      }
      if (Array.isArray(lesson.content.solvedExamples) && lesson.content.solvedExamples.length > 0) {
        setSolvedExamples(lesson.content.solvedExamples);
      }
      if (lesson.content.activeRecallSummary !== undefined) {
        setActiveRecallSummary(lesson.content.activeRecallSummary);
      }
    }
    if (lesson.mediaResources) {
      const allMedia = [
        ...(lesson.mediaResources.video || []),
        ...(lesson.mediaResources.audio || []),
        ...(lesson.mediaResources.attachments || []),
      ];
      if (allMedia.length > 0) {
        setMediaResources(allMedia);
      }
    }
  };

  const handleJsonInputChange = (text: string) => {
    setJsonInput(text);
    if (!text.trim()) {
      setJsonParsedLessons([]);
      setJsonValidationErrors([]);
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
        setJsonParsedLessons(result.validLessons);
        setJsonValidationErrors(result.errors);
        applyJsonToFormState(result.validLessons[0]);
      }
    } catch {
      // Non-blocking during typing; explicit parse and feedback available on button click
    }
  };

  const handleParseJson = (silent = false): LessonInput[] | null => {
    setIsParsingJson(true);
    setJsonValidationErrors([]);

    if (!jsonInput.trim()) {
      setJsonValidationErrors(['يرجى لصق نص JSON للدرس أو استيراد ملف صالح']);
      setIsParsingJson(false);
      if (!silent) {
        triggerSupportToast({
          title: 'لا يوجد محتوى للدرس 🔴',
          message: 'يرجى لصق كود JSON للدرس أولاً.',
          type: 'warning',
        });
      }
      return null;
    }

    try {
      let cleaned = jsonInput.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr: any) {
        // Fallback cleanup: remove trailing commas
        const sanitized = cleaned.replace(/,\s*([\}\]])/g, '$1');
        parsed = JSON.parse(sanitized);
      }

      const items = Array.isArray(parsed) ? parsed : [parsed];
      const result = validateLessonList(items);

      if (result.validLessons.length > 0) {
        setJsonParsedLessons(result.validLessons);
        applyJsonToFormState(result.validLessons[0]);

        if (result.errors.length > 0) {
          setJsonValidationErrors(result.errors);
        } else {
          setJsonValidationErrors([]);
        }

        if (!silent) {
          triggerSupportToast({
            title: 'تم التحقق من الدروس وتحديث النموذج 🟢',
            message: `تمت قراءة ${result.validLessons.length} درس بنجاح (المادة: ${result.validLessons[0].subject} - ${result.validLessons[0].lessonTitle}).`,
            type: 'success',
          });
        }
        return result.validLessons;
      } else {
        setJsonValidationErrors(
          result.errors.length > 0 ? result.errors : ['صيغة بيانات الدرس غير متطابقة']
        );
        if (!silent) {
          triggerSupportToast({
            title: 'بيانات غير متطابقة 🔴',
            message: result.errors[0] || 'يرجى التأكد من حقول الدرس (subject, lesson_title, content_json).',
            type: 'error',
          });
        }
        return null;
      }
    } catch (err: any) {
      setJsonValidationErrors([`خطأ في بنية JSON: ${err.message || 'صيغة غير صالحة'}`]);
      if (!silent) {
        triggerSupportToast({
          title: 'خطأ في بنية JSON 🔴',
          message: err.message || 'يرجى التأكد من صحة تنسيق JSON.',
          type: 'error',
        });
      }
      return null;
    } finally {
      setIsParsingJson(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonInputChange(content);
      triggerSupportToast({
        title: 'تم استيراد الملف بنجاح 🟢',
        message: `تم تحميل ملف "${file.name}" وتحديث النموذج آلياً.`,
        type: 'success',
      });
    };
    reader.readAsText(file);
  };

  const handleSaveJsonLessons = async () => {
    let lessonsToSave = jsonParsedLessons;

    // If lessons haven't been parsed yet, attempt parsing right now
    if (lessonsToSave.length === 0) {
      const parsed = handleParseJson(true);
      if (!parsed || parsed.length === 0) {
        triggerSupportToast({
          title: 'تنبيه قبل الحفظ 🔴',
          message: 'يرجى إدخال أو مراجعة كود JSON الخاص بالدرس (الذي يحوي subject, lesson_title, content_json).',
          type: 'error',
        });
        return;
      }
      lessonsToSave = parsed;
    }

    setIsSubmittingJson(true);
    triggerSupportToast({
      title: 'جاري الحفظ... ⏳',
      message: `يتم الآن إرسال ${lessonsToSave.length} درس وحفظها في قاعدة البيانات...`,
      type: 'processing',
    });

    try {
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
        throw new Error(data.error || 'تعذر حفظ الدرس في قاعدة البيانات');
      }
    } catch (err: any) {
      console.warn('[LessonUploadForm] Server API failed, saving locally:', err);
      // Offline fallback: save locally directly
      const fallbackLessons: Lesson[] = lessonsToSave.map((input, idx) => ({
        id: input.id || `les-offline-${Date.now()}-${idx}`,
        grade: input.grade,
        section: input.section || null,
        subject: input.subject,
        unitTitle: input.unitTitle || null,
        unitOrder: input.unitOrder || 1,
        lessonTitle: input.lessonTitle,
        lessonOrder: input.lessonOrder || 1,
        learningObjectiveCodes: input.learningObjectiveCodes || [],
        estimatedReadingTimeMinutes: input.estimatedReadingTimeMinutes || 10,
        content: input.content,
        mediaResources: {
          audio: input.mediaResources?.audio || [],
          video: input.mediaResources?.video || [],
          attachments: input.mediaResources?.attachments || [],
        },
        createdAt: new Date().toISOString(),
      }));
      saveLessonsLocally(fallbackLessons);
      triggerSupportToast({
        title: 'تم حفظ ونشر الدرس محلياً (Offline) 🟢',
        message: 'تم حفظ الدرس في الذاكرة المحلية للجهاز وسيعمل دون اتصال بالإنترنت.',
        type: 'offline',
      });
      if (onSuccess) onSuccess(fallbackLessons);
    } finally {
      setIsSubmittingJson(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Manual Mode Handlers
  // ---------------------------------------------------------------------------

  const handleAddConcept = () => {
    setCoreConcepts([...coreConcepts, { conceptTitle: '', explanation: '', keyTakeaway: '' }]);
  };

  const handleRemoveConcept = (idx: number) => {
    setCoreConcepts(coreConcepts.filter((_, i) => i !== idx));
  };

  const handleAddMistake = () => {
    setCommonMistakes([...commonMistakes, '']);
  };

  const handleRemoveMistake = (idx: number) => {
    setCommonMistakes(commonMistakes.filter((_, i) => i !== idx));
  };

  const handleAddExample = () => {
    setSolvedExamples([
      ...solvedExamples,
      { exampleText: '', stepByStepSolution: '', finalAnswer: '' },
    ]);
  };

  const handleRemoveExample = (idx: number) => {
    setSolvedExamples(solvedExamples.filter((_, i) => i !== idx));
  };

  const handleAddMedia = () => {
    setMediaResources([
      ...mediaResources,
      { sourceType: 'youtube_url', url: '', title: '' },
    ]);
  };

  const handleRemoveMedia = (idx: number) => {
    setMediaResources(mediaResources.filter((_, i) => i !== idx));
  };

  const handleSaveManualLesson = async () => {
    if (!lessonTitle.trim()) {
      triggerSupportToast({
        title: 'بيانات غير مكتملة 🔴',
        message: 'يرجى كتابة عنوان الدرس (lesson_title) قبل الحفظ والنشر.',
        type: 'error',
      });
      return;
    }
    if (!subject.trim()) {
      triggerSupportToast({
        title: 'بيانات غير مكتملة 🔴',
        message: 'يرجى تحديد المادة الدراسية (subject) أولاً.',
        type: 'error',
      });
      return;
    }

    setIsSavingManual(true);
    triggerSupportToast({
      title: 'جاري الحفظ... ⏳',
      message: `يتم الآن حفظ ونشر درس "${lessonTitle.trim()}" في جدول smart_exam_engine.lessons...`,
      type: 'processing',
    });

    const filteredConcepts = coreConcepts.filter(
      (c) => c.conceptTitle.trim() || c.explanation.trim()
    );
    const filteredMistakes = commonMistakes.filter((m) => m.trim().length > 0);
    const filteredExamples = solvedExamples.filter(
      (e) => e.exampleText.trim() || e.stepByStepSolution.trim()
    );

    const videos: MediaResource[] = [];
    const audios: MediaResource[] = [];
    const attachments: MediaResource[] = [];

    for (const m of mediaResources) {
      if (!m.url.trim()) continue;
      if (m.sourceType === 'youtube_url' || m.sourceType === 'url') {
        videos.push(m);
      } else {
        attachments.push(m);
      }
    }

    const payload: LessonInput = {
      id: initialLesson?.id,
      grade,
      section: section || null,
      subject: subject.trim(),
      unitTitle: unitTitle.trim() || null,
      unitOrder: Number(unitOrder) || 1,
      lessonTitle: lessonTitle.trim(),
      lessonOrder: Number(lessonOrder) || 1,
      learningObjectiveCodes: learningObjectiveCodes
        .split(/[,،]+/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0),
      estimatedReadingTimeMinutes: Number(estimatedReadingTime) || 10,
      content: {
        introduction: introduction.trim(),
        coreConcepts: filteredConcepts,
        commonMistakes: filteredMistakes,
        solvedExamples: filteredExamples,
        activeRecallSummary: activeRecallSummary.trim(),
      },
      mediaResources: {
        audio: audios,
        video: videos,
        attachments,
      },
    };

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: payload }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.lessons) && data.lessons.length > 0) {
        addOrUpdateLocalLesson(data.lessons[0]);
        triggerSupportToast({
          title: 'تم حفظ ونشر الدرس بنجاح 🟢',
          message: `تم نشر درس "${payload.lessonTitle}" في جدول smart_exam_engine.lessons بنجاح.`,
          type: 'success',
        });
        if (onSuccess) onSuccess(data.lessons);
      } else {
        throw new Error(data.error || 'تعذر حفظ الدرس في قاعدة البيانات');
      }
    } catch (err: any) {
      console.warn('[LessonUploadForm] Server API failed, saving locally:', err);
      // Offline fallback: create lesson object and save locally
      const offlineLesson: Lesson = {
        id: payload.id || `les-offline-${Date.now()}`,
        grade: payload.grade,
        section: payload.section || null,
        subject: payload.subject,
        unitTitle: payload.unitTitle || null,
        unitOrder: payload.unitOrder || 1,
        lessonTitle: payload.lessonTitle,
        lessonOrder: payload.lessonOrder || 1,
        learningObjectiveCodes: payload.learningObjectiveCodes || [],
        estimatedReadingTimeMinutes: payload.estimatedReadingTimeMinutes || 10,
        content: payload.content,
        mediaResources: {
          audio: audios,
          video: videos,
          attachments,
        },
        createdAt: new Date().toISOString(),
      };
      addOrUpdateLocalLesson(offlineLesson);
      triggerSupportToast({
        title: 'تم حفظ ونشر الدرس محلياً (Offline) 🟢',
        message: 'تم حفظ الدرس محلياً بنجاح في وضع العمل بدون إنترنت.',
        type: 'offline',
      });
      if (onSuccess) onSuccess([offlineLesson]);
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-200">
      {/* Header & Mode Switcher */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {initialLesson ? 'تعديل الدرس الهجين' : 'إضافة ورفع درس تعليمي هجين'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يدعم استيراد مخرجات Gemini Notebook مباشرة أو التحرير التفاعلي اليدوي
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeMode === 'json'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>استيراد JSON / المفكرة</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeMode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>محرر تفاعلي يدوي</span>
            </button>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: JSON / Gemini Notebook Intake Mode */}
      {/* ------------------------------------------------------------------- */}
      {activeMode === 'json' && (
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs text-blue-900 dark:text-blue-200">
                <span className="font-bold">استيراد مباشر من Gemini Notebook:</span> الصق نص المخرجات JSON
                مباشرة أو قم برفع ملف JSON بنقرة واحدة.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleJsonInputChange(SAMPLE_NOTEBOOK_JSON);
                  triggerSupportToast({
                    title: 'تم إدراج القالب النموذجي 🟢',
                    message: 'تم ملء الحقول وتحديث النموذج آلياً بالبيانات النموذجية.',
                    type: 'info',
                  });
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>تحميل قالب نموذجي</span>
              </button>
              <label className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>رفع ملف .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نص JSON لمصفوفة أو كائن الدروس:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonInputChange(e.target.value)}
              placeholder="ألصق كائن أو مصفوفة JSON للدرس هنا (يتم تحديث النموذج والتحقق آلياً)..."
              rows={12}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition ltr"
              dir="ltr"
            />
          </div>

          {/* Validation Warnings / Errors */}
          {jsonValidationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>تنبيهات التدقيق:</span>
              </div>
              <ul className="text-xs text-rose-600 dark:text-rose-400 list-disc list-inside space-y-0.5">
                {jsonValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Preview Cards */}
          {jsonParsedLessons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>معاينة الدروس التي تم التحقق منها ({jsonParsedLessons.length}):</span>
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  جاهز للنشر ومحدث في حقول النموذج آلياً
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {jsonParsedLessons.map((l, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{l.lessonTitle}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px]">
                        الصف {l.grade} • {l.subject}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                      {l.content?.introduction || 'لا توجد مقدمة'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>المفاهيم: {l.content?.coreConcepts?.length || 0}</span>
                      <span>أمثلة محلولة: {l.content?.solvedExamples?.length || 0}</span>
                      <span>وقت القراءة: {l.estimatedReadingTimeMinutes || 10} د</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {jsonParsedLessons.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMode('manual')}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل في المحرر اليدوي</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleParseJson(false)}
                disabled={isParsingJson || !jsonInput.trim()}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isParsingJson ? 'animate-spin' : ''}`} />
                <span>فحص ومعاينة البيانات</span>
              </button>

              <button
                type="button"
                onClick={handleSaveJsonLessons}
                disabled={isSubmittingJson}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isSubmittingJson ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ والنشر...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {jsonParsedLessons.length > 0
                        ? `حفظ ونشر (${jsonParsedLessons.length}) درس`
                        : 'حفظ ونشر الدرس'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: Interactive Manual Editor Mode */}
      {/* ------------------------------------------------------------------- */}
      {activeMode === 'manual' && (
        <div className="p-4 md:p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الصف الدراسي *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as Grade)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value={12}>الصف الثاني عشر (الثانوية العامة)</option>
                <option value={9}>الصف التاسع الأساسي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الشعبة / المسار
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="علمي">علمي</option>
                <option value="أدبي">أدبي</option>
                <option value="أساسي">أساسي (الصف التاسع)</option>
                <option value="تجاري">تجاري</option>
                <option value="شرعي">شرعي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المادة الدراسية *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: الرياضيات، الفيزياء..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                وقت القراءة التقديري (دقائق)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={estimatedReadingTime}
                onChange={(e) => setEstimatedReadingTime(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان الوحدة
              </label>
              <input
                type="text"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                placeholder="مثال: التفاضل والتكامل، الكهرباء المتحركة..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ترتيب الوحدة
              </label>
              <input
                type="number"
                min={1}
                value={unitOrder}
                onChange={(e) => setUnitOrder(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان الدرس *
              </label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: نهايات الدوال المثلثية والاتصال..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ترتيب الدرس في الوحدة
              </label>
              <input
                type="number"
                min={1}
                value={lessonOrder}
                onChange={(e) => setLessonOrder(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رموز مخرجات التعلم (مفصولة بفواصل)
            </label>
            <input
              type="text"
              value={learningObjectiveCodes}
              onChange={(e) => setLearningObjectiveCodes(e.target.value)}
              placeholder="مثال: MATH-12-CALC-01, MATH-12-CALC-02"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          {/* Introduction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              مقدمة وتمهيد الدرس
            </label>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="اكتب تمهيداً موجزاً يربط الدرس بالواقع وبأهداف التعلم..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
            />
          </div>

          {/* Core Concepts Builder */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>المفاهيم والنظريات الأساسية (يدعم معادلات KaTeX بالصيغة $...$ أو $$...$$)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddConcept}
                className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مفهوم</span>
              </button>
            </div>

            {coreConcepts.map((concept, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">المفهوم #{idx + 1}</span>
                  {coreConcepts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveConcept(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="حذف المفهوم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={concept.conceptTitle}
                  onChange={(e) => {
                    const updated = [...coreConcepts];
                    updated[idx].conceptTitle = e.target.value;
                    setCoreConcepts(updated);
                  }}
                  placeholder="عنوان المفهوم (مثال: النظرية الأساسية لنهاية الجيب)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />

                <textarea
                  value={concept.explanation}
                  onChange={(e) => {
                    const updated = [...coreConcepts];
                    updated[idx].explanation = e.target.value;
                    setCoreConcepts(updated);
                  }}
                  placeholder="الشرح والتفصيل الرياضي/العلمي..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />

                <input
                  type="text"
                  value={concept.keyTakeaway || ''}
                  onChange={(e) => {
                    const updated = [...coreConcepts];
                    updated[idx].keyTakeaway = e.target.value;
                    setCoreConcepts(updated);
                  }}
                  placeholder="الخلاصة الذهبية / التنبيه الجوهري (Key Takeaway)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 text-[11px]"
                />
              </div>
            ))}
          </div>

          {/* Common Mistakes */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>أشهر الأخطاء الشائعة والتحذيرات الامتحانية</span>
              </h3>
              <button
                type="button"
                onClick={handleAddMistake}
                className="px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 rounded-lg hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خطأ شائع</span>
              </button>
            </div>

            {commonMistakes.map((mistake, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={mistake}
                  onChange={(e) => {
                    const updated = [...commonMistakes];
                    updated[idx] = e.target.value;
                    setCommonMistakes(updated);
                  }}
                  placeholder={`الخطأ الشائع رقم ${idx + 1}...`}
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                {commonMistakes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMistake(idx)}
                    className="text-slate-400 hover:text-rose-500 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Solved Examples */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>أمثلة تطبيقية محلولة خطوة بخطوة</span>
              </h3>
              <button
                type="button"
                onClick={handleAddExample}
                className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مثال محلول</span>
              </button>
            </div>

            {solvedExamples.map((example, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">مثال محلول #{idx + 1}</span>
                  {solvedExamples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={example.exampleText}
                  onChange={(e) => {
                    const updated = [...solvedExamples];
                    updated[idx].exampleText = e.target.value;
                    setSolvedExamples(updated);
                  }}
                  placeholder="نص المسألة أو المثال..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />

                <textarea
                  value={example.stepByStepSolution}
                  onChange={(e) => {
                    const updated = [...solvedExamples];
                    updated[idx].stepByStepSolution = e.target.value;
                    setSolvedExamples(updated);
                  }}
                  placeholder="خطوات الحل بالتفصيل (يمكن كتابة معادلات بالـ LaTeX)..."
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />

                <input
                  type="text"
                  value={example.finalAnswer}
                  onChange={(e) => {
                    const updated = [...solvedExamples];
                    updated[idx].finalAnswer = e.target.value;
                    setSolvedExamples(updated);
                  }}
                  placeholder="الجواب النهائي المحدد (Final Answer)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 font-mono text-[11px]"
                />
              </div>
            ))}
          </div>

          {/* Active Recall Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              سؤال الاسترجاع النشط والتثبيت الفوري (Active Recall)
            </label>
            <textarea
              value={activeRecallSummary}
              onChange={(e) => setActiveRecallSummary(e.target.value)}
              placeholder="اكتب سؤال استرجاع ذهني مع جوابه السريع لاختبار استيعاب الطالب فور الانتهاء من القراءة..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Media Resources */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-500" />
                <span>الوسائط ومصادر التعلم الملحقة (فيديو يوتيوب / صوت / روابط ومرفقات)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddMedia}
                className="px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-lg hover:bg-purple-100 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مورد وسائط</span>
              </button>
            </div>

            {mediaResources.map((media, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 items-center"
              >
                <select
                  value={media.sourceType}
                  onChange={(e) => {
                    const updated = [...mediaResources];
                    updated[idx].sourceType = e.target.value as any;
                    setMediaResources(updated);
                  }}
                  className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="youtube_url">فيديو يوتيوب</option>
                  <option value="url">رابط خارجي</option>
                  <option value="file_path">مسار ملف</option>
                </select>

                <input
                  type="text"
                  value={media.title}
                  onChange={(e) => {
                    const updated = [...mediaResources];
                    updated[idx].title = e.target.value;
                    setMediaResources(updated);
                  }}
                  placeholder="عنوان المورد (مثال: شرح مرئي للمسألة)"
                  className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />

                <input
                  type="text"
                  value={media.url}
                  onChange={(e) => {
                    const updated = [...mediaResources];
                    updated[idx].url = e.target.value;
                    setMediaResources(updated);
                  }}
                  placeholder="https://youtube.com/..."
                  className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono ltr"
                  dir="ltr"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="text-slate-400 hover:text-rose-500 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Live Preview Toggle & Card */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'إخفاء المعاينة الحية' : 'معاينة شكل الدرس ومعادلات KaTeX الحية'}</span>
            </button>

            {showLivePreview && (
              <div className="p-4 rounded-2xl border-2 border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900 pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      الصف {grade} • {section} • {subject}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {lessonTitle || 'عنوان الدرس'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{estimatedReadingTime} دقائق</span>
                  </div>
                </div>

                {introduction && (
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                      تمهيد:
                    </h4>
                    <MathText text={introduction} className="text-xs text-slate-600 dark:text-slate-300" />
                  </div>
                )}

                {coreConcepts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      المفاهيم المشروحة:
                    </h4>
                    {coreConcepts.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {c.conceptTitle || `مفهوم #${i + 1}`}
                        </span>
                        <MathText text={c.explanation} className="text-slate-600 dark:text-slate-300" />
                        {c.keyTakeaway && (
                          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded text-amber-800 dark:text-amber-200 text-[11px] font-medium">
                            💡 {c.keyTakeaway}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
              >
                إلغاء
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveManualLesson}
              disabled={isSavingManual}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSavingManual ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ والنشر...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ ونشر الدرس</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
