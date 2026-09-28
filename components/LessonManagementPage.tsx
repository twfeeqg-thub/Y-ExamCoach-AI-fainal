'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, Grade } from '@/types/index';
import {
  getStoredLessons,
  saveLessonsLocally,
  deleteStoredLesson,
  syncLessonsWithServer,
} from '@/lib/lessonStore';
import { LessonUploadForm } from './LessonUploadForm';
import { MathText } from './MathText';
import { triggerSupportToast } from './SupportToast';
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Video,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  WifiOff,
  Database,
  GraduationCap,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

export const LessonManagementPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Modal / Form view
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Expanded card IDs for viewing details
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Load lessons on mount and listen for storage updates
  useEffect(() => {
    loadLessons();

    const handleStorageUpdate = () => {
      setLessons(getStoredLessons());
    };

    window.addEventListener('aadir:lessons:updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('aadir:lessons:updated', handleStorageUpdate);
    };
  }, []);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const res = await syncLessonsWithServer();
      setLessons(res.lessons);
      setIsOffline(res.isOffline);
    } catch {
      const cached = getStoredLessons();
      setLessons(cached);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLessonsWithServer();
      setLessons(res.lessons);
      setIsOffline(res.isOffline);
      triggerSupportToast({
        title: res.isOffline ? 'وضع الذاكرة المحلية (Offline)' : 'تمت المزامنة بنجاح',
        message: `تم تحديث بنك الدروس (${res.lessons.length} درس مسجل).`,
        type: res.isOffline ? 'offline' : 'success',
      });
    } catch {
      triggerSupportToast({
        title: 'فشل الاتصال بالسيرفر',
        message: 'يتم استخدام بنك الدروس المخزن محلياً.',
        type: 'warning',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف درس "${title}"؟`)) {
      return;
    }

    try {
      await fetch(`/api/lessons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // offline
    }

    deleteStoredLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
    triggerSupportToast({
      title: 'تم حذف الدرس',
      message: `تمت إزالة درس "${title}" بنجاح.`,
      type: 'info',
    });
  };

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesGrade =
        selectedGrade === 'all' || String(lesson.grade) === selectedGrade;
      const matchesSubject =
        selectedSubject === 'all' || lesson.subject === selectedSubject;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        lesson.lessonTitle.toLowerCase().includes(q) ||
        (lesson.unitTitle && lesson.unitTitle.toLowerCase().includes(q)) ||
        lesson.subject.toLowerCase().includes(q) ||
        (lesson.content?.introduction && lesson.content.introduction.toLowerCase().includes(q));

      return matchesGrade && matchesSubject && matchesQuery;
    });
  }, [lessons, selectedGrade, selectedSubject, searchQuery]);

  // Dynamic unique subjects from lessons list
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => {
      if (l.subject) set.add(l.subject);
    });
    return Array.from(set);
  }, [lessons]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = lessons.length;
    const grade12Count = lessons.filter((l) => l.grade === 12).length;
    const grade9Count = lessons.filter((l) => l.grade === 9).length;
    const totalReadingTime = lessons.reduce(
      (sum, l) => sum + (l.estimatedReadingTimeMinutes || 10),
      0
    );
    return { total, grade12Count, grade9Count, totalReadingTime };
  }, [lessons]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                المرحلة (ج2) • محرك المحتوى والدروس الهجينة
              </span>
              {isOffline && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  <span>كاش محلي</span>
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span>إدارة وبنك الدروس التعليمية الهجينة</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              محرك إدارة واستيراد الدروس النموذجية متعددة المصادر (JSON + Gemini Notebook + محرر
              تفاعلي يدوي) مع دعم معادلات KaTeX الفورية، وسائط الفيديو التوضيحية، والعمل بدون إنترنت
              (Offline-First).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
              title="مزامنة الدروس"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">مزامنة</span>
            </button>

            <button
              onClick={() => {
                setEditingLesson(null);
                setShowUploadForm(!showUploadForm);
              }}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{showUploadForm ? 'إغلاق المحرر' : 'إضافة درس جديد'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              إجمالي الدروس
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {stats.total}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              الثانوية العامة (الصف 12)
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {stats.grade12Count}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              الأساسي (الصف 9)
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.grade9Count}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              وقت القراءة الإجمالي
            </span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {stats.totalReadingTime} دقيقة
            </span>
          </div>
        </div>
      </div>

      {/* Upload & Edit Form Area */}
      {showUploadForm && (
        <LessonUploadForm
          initialLesson={editingLesson}
          onSuccess={(saved) => {
            setShowUploadForm(false);
            setEditingLesson(null);
            loadLessons();
          }}
          onCancel={() => {
            setShowUploadForm(false);
            setEditingLesson(null);
          }}
        />
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالعنوان، المادة، الوحدة، أو المفاهيم..."
            className="w-full text-xs pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Grade Filter */}
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="all">كل الصفوف</option>
              <option value="12">الصف الثاني عشر</option>
              <option value="9">الصف التاسع</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="all">كل المواد</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lessons List Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>جارٍ تحميل الدروس من قاعدة البيانات والكاش المحلي...</span>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            لم يتم العثور على أي دروس مطابقة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            يمكنك إضافة دروس جديدة عبر لصق مخرجات Gemini Notebook أو استخدام المحرر اليدوي.
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            إضافة درس جديد الآن
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => {
            const isExpanded = expandedLessonId === lesson.id;
            const coreConceptsCount = lesson.content?.coreConcepts?.length || 0;
            const solvedExamplesCount = lesson.content?.solvedExamples?.length || 0;
            const mediaCount =
              (lesson.mediaResources?.video?.length || 0) +
              (lesson.mediaResources?.audio?.length || 0) +
              (lesson.mediaResources?.attachments?.length || 0);

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition hover:shadow-md"
              >
                {/* Lesson Header Card */}
                <div className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                        الصف {lesson.grade} {lesson.section ? `• ${lesson.section}` : ''}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        {lesson.subject}
                      </span>
                      {lesson.unitTitle && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          وحدة: {lesson.unitTitle}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {lesson.lessonTitle}
                    </h3>

                    {/* Brief Intro */}
                    {lesson.content?.introduction && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {lesson.content.introduction}
                      </p>
                    )}

                    {/* Meta stats badges */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lesson.estimatedReadingTimeMinutes || 10} د</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>{coreConceptsCount} مفاهيم</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{solvedExamplesCount} أمثلة محلولة</span>
                      </span>
                      {mediaCount > 0 && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                          <Video className="w-3.5 h-3.5" />
                          <span>{mediaCount} وسائط</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setShowUploadForm(true);
                      }}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition text-xs font-bold"
                      title="تعديل الدرس"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDeleteLesson(lesson.id, lesson.lessonTitle)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition"
                      title="حذف الدرس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setExpandedLessonId(isExpanded ? null : lesson.id)
                      }
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض المحتوى الكامل'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Full Lesson Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 md:p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
                    {/* Objectives Chips */}
                    {lesson.learningObjectiveCodes && lesson.learningObjectiveCodes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500">
                          مخرجات التعلم المستهدفة:
                        </span>
                        {lesson.learningObjectiveCodes.map((code) => (
                          <span
                            key={code}
                            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-900"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Detailed Introduction */}
                    {lesson.content?.introduction && (
                      <div className="space-y-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          التمهيد ومدخل الدرس:
                        </h4>
                        <MathText
                          text={lesson.content.introduction}
                          className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Core Concepts with KaTeX */}
                    {lesson.content?.coreConcepts && lesson.content.coreConcepts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>المفاهيم والنظريات الأساسية:</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {lesson.content.coreConcepts.map((concept, i) => (
                            <div
                              key={i}
                              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                                  {concept.conceptTitle}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  مفهوم {i + 1}
                                </span>
                              </div>
                              <MathText
                                text={concept.explanation}
                                className="text-xs text-slate-600 dark:text-slate-300"
                              />
                              {concept.keyTakeaway && (
                                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-lg text-amber-900 dark:text-amber-200 text-xs font-medium flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span>{concept.keyTakeaway}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solved Examples with Step-by-Step KaTeX */}
                    {lesson.content?.solvedExamples && lesson.content.solvedExamples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>أمثلة تطبيقية محلولة خطوة بخطوة:</span>
                        </h4>
                        <div className="space-y-3">
                          {lesson.content.solvedExamples.map((ex, i) => (
                            <div
                              key={i}
                              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span>مسألة #{i + 1}</span>
                              </div>
                              <MathText
                                text={ex.exampleText}
                                className="text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg space-y-1">
                                <span className="text-[11px] font-extrabold text-slate-500 block">
                                  خطوات الحل:
                                </span>
                                <MathText
                                  text={ex.stepByStepSolution}
                                  className="text-xs text-slate-700 dark:text-slate-300"
                                />
                              </div>
                              {ex.finalAnswer && (
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
                                  <span>النتيجة النهائية:</span>
                                  <MathText text={ex.finalAnswer} inline />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common Mistakes */}
                    {lesson.content?.commonMistakes && lesson.content.commonMistakes.length > 0 && (
                      <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-2">
                        <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span>تحذيرات امتحانية وأخطاء شائعة يجب تجنبها:</span>
                        </h4>
                        <ul className="text-xs text-rose-700 dark:text-rose-300 space-y-1 list-disc list-inside">
                          {lesson.content.commonMistakes.map((mistake, i) => (
                            <li key={i}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Active Recall Summary */}
                    {lesson.content?.activeRecallSummary && (
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-1.5">
                        <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-indigo-600" />
                          <span>تثبيت الذاكرة السريع (Active Recall):</span>
                        </h4>
                        <MathText
                          text={lesson.content.activeRecallSummary}
                          className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium"
                        />
                      </div>
                    )}

                    {/* Media Resources Links */}
                    {((lesson.mediaResources?.video && lesson.mediaResources.video.length > 0) ||
                      (lesson.mediaResources?.attachments &&
                        lesson.mediaResources.attachments.length > 0)) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <PlayCircle className="w-4 h-4 text-purple-500" />
                          <span>المصادر والوسائط التوضيحية:</span>
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {lesson.mediaResources.video?.map((v, i) => (
                            <a
                              key={i}
                              href={v.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition flex items-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{v.title || 'فيديو شرح'}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ))}
                          {lesson.mediaResources.attachments?.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{att.title || 'مرفق'}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
