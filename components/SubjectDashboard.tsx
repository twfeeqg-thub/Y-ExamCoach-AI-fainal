'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Lesson, Question } from '@/types/index';
import { triggerSupportToast } from '@/components/SupportToast';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Bell,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Globe,
  BookOpenCheck,
  BookMarked,
  HeartHandshake,
  Clock,
  Target,
  ChevronLeft,
  X,
  Play,
  Share2,
  Flame,
  Layers,
  Search,
} from 'lucide-react';

export type GradeFilterKey = 'grade_9_basic' | 'grade_12_sci' | 'grade_12_lit';

export interface SubjectMetadata {
  id: string;
  name: string;
  englishName: string;
  icon: React.ComponentType<{ className?: string }>;
  colorGradient: string;
  accentColor: string;
  description: string;
  isActive: (gradeKey: GradeFilterKey) => boolean;
  unitCount?: number;
  lessonCount?: number;
}

export const ALL_SUBJECTS: SubjectMetadata[] = [
  {
    id: 'math',
    name: 'الرياضيات',
    englishName: 'Mathematics',
    icon: Calculator,
    colorGradient: 'from-blue-600 to-indigo-700',
    accentColor: 'blue',
    description: 'التفاضل والتكامل، نهايات الدوال المثلثية، والجبر والهندسة التحليلية.',
    isActive: (gradeKey) => gradeKey === 'grade_12_sci',
    unitCount: 4,
    lessonCount: 16,
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    englishName: 'Physics',
    icon: Atom,
    colorGradient: 'from-purple-600 to-indigo-800',
    accentColor: 'purple',
    description: 'الكهرباء المتحركة، المغناطيسية، والفيزياء الذرية والنووية الحديثة.',
    isActive: () => false,
    unitCount: 5,
    lessonCount: 20,
  },
  {
    id: 'chemistry',
    name: 'الكيمياء',
    englishName: 'Chemistry',
    icon: FlaskConical,
    colorGradient: 'from-amber-500 to-orange-600',
    accentColor: 'amber',
    description: 'البناء الإلكتروني، المحاليل المنظمة، والكيمياء العضوية والحرارية.',
    isActive: () => false,
    unitCount: 4,
    lessonCount: 18,
  },
  {
    id: 'biology',
    name: 'الأحياء',
    englishName: 'Biology',
    icon: Dna,
    colorGradient: 'from-emerald-600 to-teal-700',
    accentColor: 'emerald',
    description: 'علم الوراثة الجزيئية، التكاثر الخلوي، وأجهزة جسم الإنسان والبيئة.',
    isActive: () => false,
    unitCount: 4,
    lessonCount: 15,
  },
  {
    id: 'english',
    name: 'اللغة الإنجليزية',
    englishName: 'English Language',
    icon: Globe,
    colorGradient: 'from-cyan-600 to-blue-700',
    accentColor: 'cyan',
    description: 'Grammar mastery, Reading Comprehension, Vocabularies & Writing.',
    isActive: () => false,
    unitCount: 6,
    lessonCount: 24,
  },
  {
    id: 'arabic',
    name: 'اللغة العربية',
    englishName: 'Arabic Language',
    icon: BookOpenCheck,
    colorGradient: 'from-rose-600 to-pink-700',
    accentColor: 'rose',
    description: 'النحو والصرف، البلاغة والأدب، والنصوص والقراءة والمطالعة المنهجية.',
    isActive: () => false,
    unitCount: 5,
    lessonCount: 22,
  },
  {
    id: 'quran',
    name: 'القرآن الكريم',
    englishName: 'Holy Quran',
    icon: BookMarked,
    colorGradient: 'from-teal-600 to-emerald-800',
    accentColor: 'teal',
    description: 'التلاوة والتجويد، معاني الآيات المقررة، وأسباب النزول والموضوعات.',
    isActive: () => false,
    unitCount: 4,
    lessonCount: 14,
  },
  {
    id: 'islamic',
    name: 'التربية الإسلامية',
    englishName: 'Islamic Studies',
    icon: HeartHandshake,
    colorGradient: 'from-sky-700 to-indigo-900',
    accentColor: 'indigo',
    description: 'العقيدة الإسلامية، الفقه المقارن، السيرة النبوية، والأخلاق والتهذيب.',
    isActive: () => false,
    unitCount: 4,
    lessonCount: 16,
  },
];

interface SubjectDashboardProps {
  onNavigateToPractice?: () => void;
  onNavigateToLessons?: () => void;
  onNavigateToQuestions?: () => void;
}

export const SubjectDashboard: React.FC<SubjectDashboardProps> = ({
  onNavigateToPractice,
  onNavigateToLessons,
  onNavigateToQuestions,
}) => {
  const { questions: allQuestions } = useApp();

  // Grade Selection State
  const [selectedGrade, setSelectedGrade] = useState<GradeFilterKey>('grade_12_sci');

  // Active Subject View Mode
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeMathSubTab, setActiveMathSubTab] = useState<'lessons' | 'questions'>('lessons');

  // Under Development Modal State
  const [underDevModal, setUnderDevModal] = useState<{
    isOpen: boolean;
    subjectName?: string;
    gradeLabel?: string;
  }>({ isOpen: false });

  // Lessons data state
  const [mathLessons, setMathLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState<boolean>(false);
  const [activeReadingLesson, setActiveReadingLesson] = useState<Lesson | null>(null);

  // Fetch Math Grade 12 Lessons
  useEffect(() => {
    let isMounted = true;
    async function loadMathLessons() {
      setIsLoadingLessons(true);
      try {
        const res = await fetch('/api/lessons?subject=' + encodeURIComponent('الرياضيات') + '&grade=12&section=' + encodeURIComponent('علمي'));
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.lessons)) {
          setMathLessons(json.lessons);
        }
      } catch (err) {
        console.error('Failed to load math lessons:', err);
      } finally {
        if (isMounted) setIsLoadingLessons(false);
      }
    }
    loadMathLessons();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter questions for Math Grade 12 Scientific
  const mathQuestions = allQuestions.filter(
    (q) => q.subject === 'الرياضيات' && Number(q.grade) === 12 && q.section === 'علمي'
  );

  const getGradeInfo = (key: GradeFilterKey) => {
    switch (key) {
      case 'grade_9_basic':
        return { label: 'الصف التاسع (الأساسي)', gradeNum: 9, section: 'أساسي' };
      case 'grade_12_sci':
        return { label: 'الثالث الثانوي (علمي)', gradeNum: 12, section: 'علمي' };
      case 'grade_12_lit':
        return { label: 'الثالث الثانوي (أدبي)', gradeNum: 12, section: 'أدبي' };
    }
  };

  const handleGradeSelect = (key: GradeFilterKey) => {
    setSelectedGrade(key);
    if (key !== 'grade_12_sci') {
      const info = getGradeInfo(key);
      setUnderDevModal({
        isOpen: true,
        gradeLabel: info.label,
        subjectName: 'هذه المرحلة الدراسية',
      });
      triggerSupportToast({
        title: 'قيد التطوير 🚀',
        message: '🚀 المحتوى قيد الإعداد والتطوير حالياً! نعمل على إتاحة هذه المادة قريباً وسيتم إشعارك فور إطلاقها.',
        type: 'info',
      });
    } else {
      setSelectedSubjectId('math');
    }
  };

  const handleSubjectClick = (subject: SubjectMetadata) => {
    const isAct = subject.isActive(selectedGrade);
    if (isAct) {
      setSelectedSubjectId(subject.id);
    } else {
      const info = getGradeInfo(selectedGrade);
      setUnderDevModal({
        isOpen: true,
        subjectName: subject.name,
        gradeLabel: info.label,
      });
      triggerSupportToast({
        title: 'قيد التطوير 🚀',
        message: '🚀 المحتوى قيد الإعداد والتطوير حالياً! نعمل على إتاحة هذه المادة قريباً وسيتم إشعارك فور إطلاقها.',
        type: 'info',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Active Mathematics Subject View
  // ---------------------------------------------------------------------------
  if (selectedSubjectId === 'math' && selectedGrade === 'grade_12_sci') {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
        {/* Back and Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs md:text-sm font-bold shadow-sm"
              title="العودة لاختيار المواد"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة المواد</span>
            </button>

            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>الثالث الثانوي (علمي)</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">مادة الرياضيات</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPractice && (
              <button
                onClick={onNavigateToPractice}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 active:scale-95"
              >
                <Target className="w-4 h-4" />
                <span>بدء التدريب التكيفي</span>
              </button>
            )}
          </div>
        </div>

        {/* Math Subject Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-white">
                  مادة مفعلة بالكامل 🚀
                </span>
                <span className="px-3 py-1 bg-amber-400/90 text-slate-900 rounded-full text-xs font-black">
                  امتحان وزاري مؤكد
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black flex items-center gap-3">
                <Calculator className="w-8 h-8 md:w-10 md:h-10 shrink-0 text-amber-300" />
                <span>الرياضيات - الصف الثالث الثانوي (علمي)</span>
              </h1>
              <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
                تشمل وحدات التفاضل والتكامل، نهايات الدوال المثلثية، الاتصال، وقواعد الاشتقاق. المحتوى مسترجع مباشرة من جداول <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-white">smart_exam_engine.lessons</code> و <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-white">questions</code>.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
              <div className="text-center px-3 border-l border-white/20">
                <div className="text-2xl font-black font-mono">{mathLessons.length}</div>
                <div className="text-[11px] text-blue-100">دروس مسجلة</div>
              </div>
              <div className="text-center px-3">
                <div className="text-2xl font-black font-mono">{mathQuestions.length}</div>
                <div className="text-[11px] text-blue-100">أسئلة وزارية</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs: Lessons vs Questions */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveMathSubTab('lessons')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
              activeMathSubTab === 'lessons'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دروس الرياضيات المقررة ({mathLessons.length})</span>
          </button>

          <button
            onClick={() => setActiveMathSubTab('questions')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
              activeMathSubTab === 'questions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الوزارية المعيارية ({mathQuestions.length})</span>
          </button>
        </div>

        {/* Lessons Tab Content */}
        {activeMathSubTab === 'lessons' && (
          <div className="space-y-4">
            {isLoadingLessons ? (
              <div className="p-12 text-center text-slate-500">جاري تحميل دروس الرياضيات...</div>
            ) : mathLessons.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                لا توجد دروس حالياً لمادة الرياضيات.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mathLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl">
                          {lesson.unitTitle || 'الوحدة الأولى'}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.estimatedReadingTimeMinutes || 12} دقيقة
                        </span>
                      </div>

                      <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
                        {lesson.lessonTitle}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {lesson.content?.introduction || 'محتوى الدرس النموذجي يركز على المفاهيم الأساسية والأمثلة المحلولة.'}
                      </p>

                      {/* Core concepts badge */}
                      {lesson.content?.coreConcepts && lesson.content.coreConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {lesson.content.coreConcepts.slice(0, 3).map((concept, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              💡 {concept.conceptTitle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        جاهز للمراجعة والاستذكار
                      </span>

                      <button
                        onClick={() => setActiveReadingLesson(lesson)}
                        className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>فتح وقراءة الدرس</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Questions Tab Content */}
        {activeMathSubTab === 'questions' && (
          <div className="space-y-4">
            {mathQuestions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                لا توجد أسئلة مسجلة حالياً لمادة الرياضيات.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {mathQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl">
                        سؤال #{idx + 1} • {q.unit || 'التفاضل والتكامل'}
                      </span>
                      <div className="flex items-center gap-2">
                        {q.examYears && q.examYears.length > 0 && (
                          <span className="text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg font-mono font-bold">
                            سنوات الورود: {q.examYears.join(', ')}
                          </span>
                        )}
                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                          صعوبة: {q.estimatedDifficulty || 'متوسط'}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
                      {q.questionText}
                    </h4>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
                      <div
                        className={`p-3 rounded-2xl border transition ${
                          q.correctOption === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className="font-black ml-2 font-mono">A)</span> {q.optionA}
                      </div>

                      <div
                        className={`p-3 rounded-2xl border transition ${
                          q.correctOption === 'B'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className="font-black ml-2 font-mono">B)</span> {q.optionB}
                      </div>

                      {q.optionC && (
                        <div
                          className={`p-3 rounded-2xl border transition ${
                            q.correctOption === 'C'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-black ml-2 font-mono">C)</span> {q.optionC}
                        </div>
                      )}

                      {q.optionD && (
                        <div
                          className={`p-3 rounded-2xl border transition ${
                            q.correctOption === 'D'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-black ml-2 font-mono">D)</span> {q.optionD}
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {q.correctExplanation && (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="font-bold">الشرح والحل النموذجي: </span>
                        {q.correctExplanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Full Lesson Reader */}
        {activeReadingLesson && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-5 md:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-blue-600 font-bold">
                    {activeReadingLesson.unitTitle || 'الوحدة الأولى'}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {activeReadingLesson.lessonTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveReadingLesson(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Introduction */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold block mb-1 text-slate-900 dark:text-slate-100">مقدمة الدرس:</span>
                {activeReadingLesson.content?.introduction}
              </div>

              {/* Core Concepts */}
              {activeReadingLesson.content?.coreConcepts && activeReadingLesson.content.coreConcepts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>المفاهيم والنظريات الأساسية:</span>
                  </h4>
                  <div className="space-y-2">
                    {activeReadingLesson.content.coreConcepts.map((c, i) => (
                      <div key={i} className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 text-xs space-y-1">
                        <span className="font-bold text-blue-800 dark:text-blue-300">{c.conceptTitle}</span>
                        <p className="text-slate-600 dark:text-slate-400">{c.explanation}</p>
                        {c.keyTakeaway && (
                          <span className="block text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                            📌 خلاصة: {c.keyTakeaway}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solved Examples */}
              {activeReadingLesson.content?.solvedExamples && activeReadingLesson.content.solvedExamples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>أمثلة وزارية محلولة خطوة بخطوة:</span>
                  </h4>
                  <div className="space-y-2">
                    {activeReadingLesson.content.solvedExamples.map((ex, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">مثال {i + 1}: {ex.exampleText}</span>
                        <pre className="font-sans whitespace-pre-line text-slate-600 dark:text-slate-300 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {ex.stepByStepSolution}
                        </pre>
                        {ex.finalAnswer && (
                          <div className="font-bold text-emerald-600 text-xs">
                            النتيجة النهائية: {ex.finalAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Recall */}
              {activeReadingLesson.content?.activeRecallSummary && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-1">🧠 سؤال التثبيت والاسترجاع السريع:</span>
                  {activeReadingLesson.content.activeRecallSummary}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveReadingLesson(null)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  إغلاق الدرس
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Selection Grid View (Layer 1: Grade Filters, Layer 2: Subject Cards Grid)
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>بوابة المواد والمراحل الدراسية</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1">
            اختر الصف والمرحلة لعرض بطاقات المواد المعتمدة وخوض تجربة التعلم الذكي التكيفي.
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-3.5 py-2 rounded-2xl text-xs font-semibold text-blue-800 dark:text-blue-200">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>المحتوى المفعل المعتمد: الثالث الثانوي علمي (الرياضيات)</span>
        </div>
      </div>

      {/* Layer 1: Grade Filter Tabs */}
      <div className="space-y-3">
        <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 block">
          المرحلة الدراسية المقررة:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Grade 9 Basic */}
          <button
            type="button"
            onClick={() => handleGradeSelect('grade_9_basic')}
            className={`p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedGrade === 'grade_9_basic'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-100 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-sm md:text-base block">الصف التاسع (الأساسي)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">الشهادة الأساسية العامة</span>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
              قيد الإعداد ⏳
            </span>
          </button>

          {/* Grade 12 Scientific (ACTIVE) */}
          <button
            type="button"
            onClick={() => handleGradeSelect('grade_12_sci')}
            className={`p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedGrade === 'grade_12_sci'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border-blue-600 text-blue-950 dark:text-blue-100 shadow-md ring-2 ring-blue-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-sm md:text-base block text-blue-700 dark:text-blue-400">
                الثالث الثانوي (علمي) ⭐
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">الثانوية العامة - الفرع العلمي</span>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-black border border-emerald-300 dark:border-emerald-800">
              مفعل ومتاح 🚀
            </span>
          </button>

          {/* Grade 12 Literary */}
          <button
            type="button"
            onClick={() => handleGradeSelect('grade_12_lit')}
            className={`p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedGrade === 'grade_12_lit'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-100 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-sm md:text-base block">الثالث الثانوي (أدبي)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">الثانوية العامة - الفرع الأدبي</span>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
              قيد الإعداد ⏳
            </span>
          </button>
        </div>
      </div>

      {/* Layer 2: Subject Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              المواد المدرسية المقررة ({ALL_SUBJECTS.length} مواد)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            انقر على أي بطاقة لبدء الاستكشاف والتدريب
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {ALL_SUBJECTS.map((sub) => {
            const Icon = sub.icon;
            const isAct = sub.isActive(selectedGrade);

            return (
              <div
                key={sub.id}
                onClick={() => handleSubjectClick(sub)}
                className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between p-5 md:p-6 shadow-sm active:scale-[0.98] ${
                  isAct
                    ? 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:shadow-md'
                }`}
              >
                {/* Top Badge & Icon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sub.colorGradient} text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {isAct ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>مفعلة وجاهزة 🚀</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        قيد الإعداد ⏳
                      </span>
                    )}
                  </div>

                  {/* Subject Titles */}
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sub.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {sub.englishName}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  {isAct ? (
                    <>
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span>دخول للمادة</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {mathLessons.length} دروس • {mathQuestions.length} أسئلة
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex items-center gap-1">
                        <span>إشعار فور الإطلاق</span>
                        <Bell className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] text-slate-400">قريباً</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Under Development Modal */}
      {underDevModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
              <Rocket className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-xs font-extrabold inline-block">
                ميزة قادمة قريباً
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">
                {underDevModal.subjectName ? `مادة ${underDevModal.subjectName}` : 'المحتوى المختار'}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                🚀 المحتوى قيد الإعداد والتطوير حالياً! نعمل على إتاحة هذه المادة قريباً وسيتم إشعارك فور إطلاقها.
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-xs text-blue-900 dark:text-blue-200 text-right space-y-1">
              <span className="font-bold flex items-center gap-1 text-blue-800 dark:text-blue-300">
                💡 هل تعلم؟
              </span>
              <span>
                مادة <strong className="font-bold">الرياضيات (الثالث الثانوي العلمي)</strong> مفعلة ومكتملة الآن بالدروس والأسئلة الوزارية!
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUnderDevModal({ isOpen: false });
                  setSelectedGrade('grade_12_sci');
                  setSelectedSubjectId('math');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                تجربة مادة الرياضيات الآن
              </button>
              <button
                type="button"
                onClick={() => setUnderDevModal({ isOpen: false })}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                إغلاق التنبيه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDashboard = SubjectDashboard;
export default SubjectDashboard;
