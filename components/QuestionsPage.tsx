'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SmartQuestionCard } from './SmartQuestionCard';
import { QuestionInput } from '@/types/index';
import { triggerSupportToast } from '@/components/SupportToast';
import { getRandomSupportMessage } from '@/lib/psychologicalSupport';
import {
  HelpCircle,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  X,
  FileText,
  Layers,
  Heart,
  Database,
} from 'lucide-react';

export const QuestionsPage: React.FC = () => {
  const {
    questions,
    files,
    addQuestions,
    deleteAllQuestionsFromStateAndServer,
    focusFileId,
    setFocusFileId,
    stats,
    databaseStatus,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(false);

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<QuestionInput>({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    grade: 12,
    section: 'علمي',
    subject: 'الرياضيات',
    estimatedDifficulty: 'medium',
    correctExplanation: '',
    unit: '',
    lesson: '',
  });

  // Filter Logic
  const filteredQuestions = questions.filter((q) => {
    // Focus File Filter
    if (focusFileId && q.fileId !== focusFileId) return false;

    // Search Query
    if (
      searchQuery &&
      !q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.optionA.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.optionB.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Subject Filter
    if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;

    // Grade Filter
    if (selectedGrade !== 'all' && String(q.grade) !== selectedGrade) return false;

    // Difficulty Filter
    if (selectedDifficulty !== 'all' && q.estimatedDifficulty !== selectedDifficulty) return false;

    // Duplicates Only Filter
    if (showDuplicatesOnly && !q.isDuplicate) return false;

    return true;
  });

  // Focused File Details
  const focusedFile = files.find((f) => f.id === focusFileId);

  // Handle Add New Question Form Submission
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.questionText || !newQuestion.optionA || !newQuestion.optionB) {
      alert('يرجى ملء نص السؤال والحيارين A و B على الأقل');
      return;
    }

    await addQuestions([newQuestion], focusFileId);
    setShowAddModal(false);

    // Trigger Psychological Support Notification
    const supportMsg = getRandomSupportMessage('questionSaved');
    triggerSupportToast({
      title: 'تمت إضافة السؤال بنجاح',
      message: supportMsg,
      type: 'success',
    });

    setNewQuestion({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      grade: 12,
      section: 'علمي',
      subject: 'الرياضيات',
      estimatedDifficulty: 'medium',
      correctExplanation: '',
      unit: '',
      lesson: '',
    });
  };

  // Handle Reset / Clear All Questions
  const handleClearAllQuestions = async () => {
    if (confirm('هل أنت تأكد من رغبتك في تصفير ومسح بنك الأسئلة بالكامل؟')) {
      const success = await deleteAllQuestionsFromStateAndServer();
      if (success) {
        const supportMsg = getRandomSupportMessage('bankCleared');
        triggerSupportToast({
          title: 'تمت إعادة تهيئة بنك الأسئلة',
          message: supportMsg,
          type: 'info',
        });
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>بنك الأسئلة والمراجعة التربوية الشاملة</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1">
            إدارة الأسئلة المستخلصة، حوكمة التكرار بالهاش الرقمي، وتعديل الشروح والمشتتات.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة سؤال يدوياً</span>
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleClearAllQuestions}
              className="px-3.5 py-2.5 border border-rose-300 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>تصفير بنك الأسئلة</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Panel (Responsive 2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 block font-medium">إجمالي الأسئلة المتاحة</span>
          <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {stats.totalQuestions}
          </span>
        </div>

        <div className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] md:text-xs text-amber-600 dark:text-amber-400 block font-medium">الأسئلة المكررة والمكشوفة</span>
          <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.duplicateQuestionsCount}
          </span>
        </div>

        <div className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] md:text-xs text-emerald-600 dark:text-emerald-400 block font-medium">المستندات المعالجة</span>
          <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.processedFilesCount}
          </span>
        </div>

        <div className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] md:text-xs text-blue-600 dark:text-blue-400 block font-medium">حالة المحرك الحالي</span>
          <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${databaseStatus === 'offline' ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
            <span>{databaseStatus === 'offline' ? 'المحرك المحلي المضمون' : 'سحابي متصل'}</span>
          </span>
        </div>
      </div>

      {/* Focus File Alert Bar */}
      {focusFileId && focusedFile && (
        <div className="p-3.5 md:p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs md:text-sm text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              أسئلة المستند المختار: <strong className="font-bold underline">{focusedFile.name}</strong>
            </span>
          </div>
          <button
            onClick={() => setFocusFileId(null)}
            className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm min-h-[36px]"
          >
            عرض كافة الأسئلة
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 md:space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في نصوص الأسئلة أو الخيارات..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          {/* Quick Filter Selects (Overflow Horizontal Scrollable on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs whitespace-nowrap">
            {/* Subject */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 min-h-[40px]"
            >
              <option value="all">كل المواد</option>
              <option value="الرياضيات">الرياضيات</option>
              <option value="الفيزياء">الفيزياء</option>
              <option value="الكيمياء">الكيمياء</option>
              <option value="الأحياء">الأحياء</option>
            </select>

            {/* Grade */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 min-h-[40px]"
            >
              <option value="all">كل الصفوف</option>
              <option value="9">الصف التاسع</option>
              <option value="12">الصف الثاني عشر</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 min-h-[40px]"
            >
              <option value="all">كل المستويات</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>

            {/* Duplicates Toggle */}
            <button
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              className={`px-3 py-2 rounded-xl border transition flex items-center gap-1.5 shrink-0 min-h-[40px] ${
                showDuplicatesOnly
                  ? 'bg-amber-500 text-white border-amber-500 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>المكررة فقط ({stats.duplicateQuestionsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Question Sheet / Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-2xl w-full p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 md:animate-in md:fade-in">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto md:hidden" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <span>إضافة سؤال جديد لبنك الأسئلة</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  نص السؤال *
                </label>
                <textarea
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  rows={3}
                  required
                  placeholder="اكتب نص السؤال هنا..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">الخيار (A) *</label>
                  <input
                    type="text"
                    value={newQuestion.optionA}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">الخيار (B) *</label>
                  <input
                    type="text"
                    value={newQuestion.optionB}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">الخيار (C)</label>
                  <input
                    type="text"
                    value={newQuestion.optionC || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">الخيار (D)</label>
                  <input
                    type="text"
                    value={newQuestion.optionD || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">الخيار الصحيح *</label>
                  <select
                    value={newQuestion.correctOption}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correctOption: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  >
                    <option value="A">الخيار A</option>
                    <option value="B">الخيار B</option>
                    <option value="C">الخيار C</option>
                    <option value="D">الخيار D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">المادة الدراسية</label>
                  <input
                    type="text"
                    value={newQuestion.subject || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">مستوى الصعوبة</label>
                  <select
                    value={newQuestion.estimatedDifficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, estimatedDifficulty: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 min-h-[44px]"
                  >
                    <option value="easy">سهل</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">صعب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">التفسير والشرح التربوي</label>
                <textarea
                  value={newQuestion.correctExplanation || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctExplanation: e.target.value })}
                  rows={2}
                  placeholder="شرح الإجابة النموذجية..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 md:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl min-h-[44px]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-1/2 md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وإضافة للبنك</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 shrink-0" />
            <span>قائمة الأسئلة المعروضة ({filteredQuestions.length})</span>
          </h2>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="p-8 md:p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">لا توجد أسئلة تطابق الفلتر المعتمد</h3>
            <p className="text-xs max-w-md mx-auto">
              حتى لو بدأت من الصفر، يمكنك رفع نموذج امتحان جديد أو إضافة سؤال يدوي لبناء بنكك الذكي.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredQuestions.map((question) => (
              <SmartQuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsPage;
