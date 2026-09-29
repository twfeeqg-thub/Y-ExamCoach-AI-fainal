'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson } from '@/types/index';
import { MathText } from '@/components/MathText';
import {
  X,
  RotateCw,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Brain,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

export interface FlashcardsModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Flashcard {
  id: string;
  type: 'concept' | 'recall' | 'mistake' | 'example';
  badgeLabel: string;
  badgeColor: string;
  frontTitle: string;
  frontContent?: string;
  backContent: string;
  keyTakeaway?: string;
  extra?: string;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  // Generate flashcards from lesson content
  useEffect(() => {
    if (!lesson || !lesson.content) {
      setCards([]);
      return;
    }

    const generated: Flashcard[] = [];
    const content = lesson.content;

    // 1. Core Concepts
    if (Array.isArray(content.coreConcepts)) {
      content.coreConcepts.forEach((c, idx) => {
        generated.push({
          id: `concept-${idx}`,
          type: 'concept',
          badgeLabel: `مفهوم رئيسي #${idx + 1}`,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
          frontTitle: c.conceptTitle,
          frontContent: 'ما هو المقصود بهذا المفهوم؟ وما هي معادلته أو خصائصه الجوهرية؟',
          backContent: c.explanation,
          keyTakeaway: c.keyTakeaway,
        });
      });
    }

    // 2. Active Recall Summary
    if (content.activeRecallSummary && content.activeRecallSummary.trim().length > 0) {
      generated.push({
        id: 'recall-summary',
        type: 'recall',
        badgeLabel: 'استدعاء نشط ومراجعة ذاتية 🧠',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900',
        frontTitle: 'سؤال الاستدعاء الذهني السريع (Active Recall)',
        frontContent: 'حاول استذكار أهم نقطة أو قاعدة جوهرية في هذا الدرس دون النظر للشرح!',
        backContent: content.activeRecallSummary,
      });
    }

    // 3. Common Mistakes
    if (Array.isArray(content.commonMistakes)) {
      content.commonMistakes.forEach((m, idx) => {
        generated.push({
          id: `mistake-${idx}`,
          type: 'mistake',
          badgeLabel: `خطأ شائع وتحذير #${idx + 1} ⚠️`,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
          frontTitle: 'ما هو الخطأ الشائع الذي يقع فيه معظم الطلاب في هذا الدرس؟',
          frontContent: 'فكر في الفخاخ الامتحانية الشائعة وكيفية تفاديها...',
          backContent: m,
          keyTakeaway: 'تأكد دائماً من مراجعة خطواتك وتحقق من الوحدات والإشارات الرياضية بدقة.',
        });
      });
    }

    // 4. Solved Examples
    if (Array.isArray(content.solvedExamples)) {
      content.solvedExamples.forEach((ex, idx) => {
        generated.push({
          id: `example-${idx}`,
          type: 'example',
          badgeLabel: `مثال تطبيقي محلول #${idx + 1} ✍️`,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
          frontTitle: `المسألة النموذجية:`,
          frontContent: ex.exampleText,
          backContent: ex.stepByStepSolution,
          extra: ex.finalAnswer ? `النتيجة النهائية: ${ex.finalAnswer}` : undefined,
        });
      });
    }

    // Fallback if empty
    if (generated.length === 0) {
      generated.push({
        id: 'fallback-intro',
        type: 'concept',
        badgeLabel: 'مدخل الدرس',
        badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        frontTitle: lesson.lessonTitle,
        frontContent: 'ما هي الفكرة العامة لدرس اليوم؟',
        backContent: content.introduction || 'لا توجد بيانات تفصيلية مضافة لهذا الدرس بعد.',
      });
    }

    setCards(generated);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedSet(new Set());
  }, [lesson]);

  // Filter cards
  const filteredCards = useMemo(() => {
    if (selectedFilter === 'all') return cards;
    return cards.filter((c) => c.type === selectedFilter);
  }, [cards, selectedFilter]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedFilter]);

  const currentCard = filteredCards[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      if (next && currentCard) {
        setCompletedSet((set) => new Set(set).add(currentCard.id));
      }
      return next;
    });
  }, [currentCard]);

  const handleShuffle = useCallback(() => {
    setIsFlipped(false);
    setCards((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    setCurrentIndex(0);
  }, []);

  // Keyboard navigation (Escape to close, Arrows to navigate, Space to flip)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        // RTL forward
        handleNext();
      } else if (e.key === 'ArrowRight') {
        // RTL backward
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, handleFlip]);

  if (!isOpen || !lesson) return null;

  const total = filteredCards.length;
  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const masteredCount = completedSet.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100">
                  البطاقات التعليمية التفاعلية (Flashcards)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-extrabold">
                  {currentIndex + 1} / {total}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                درس: {lesson.lessonTitle} {lesson.unitTitle ? `• وحدة: ${lesson.unitTitle}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition cursor-pointer"
              title="إعادة ترتيب البطاقات عشوائياً"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="إغلاق النافذة (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 md:px-6 py-2.5 bg-slate-50/40 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل ({cards.length})
            </button>
            <button
              onClick={() => setSelectedFilter('concept')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                selectedFilter === 'concept'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              المفاهيم
            </button>
            <button
              onClick={() => setSelectedFilter('mistake')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                selectedFilter === 'mistake'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الأخطاء الشائعة
            </button>
            <button
              onClick={() => setSelectedFilter('example')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                selectedFilter === 'example'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              أمثلة محلولة
            </button>
            <button
              onClick={() => setSelectedFilter('recall')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                selectedFilter === 'recall'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              استدعاء نشط
            </button>
          </div>

          {/* Mastered Counter */}
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>تم استعراض {masteredCount} من {cards.length} بطاقة</span>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card Stage / 3D Canvas */}
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[340px]">
          {total === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">لا توجد بطاقات في هذا التصنيف لهذا الدرس.</p>
            </div>
          ) : (
            <div
              className="w-full max-w-xl cursor-pointer select-none"
              style={{ perspective: '1200px' }}
              onClick={handleFlip}
            >
              <div
                className={`relative w-full rounded-3xl transition-transform duration-500 ease-out border shadow-lg ${
                  isFlipped
                    ? 'border-indigo-300 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'
                }`}
                style={{
                  minHeight: '320px',
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ---------------- FRONT FACE ---------------- */}
                <div
                  className={`p-6 md:p-8 flex flex-col justify-between h-full ${
                    isFlipped ? 'hidden' : 'block'
                  }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black border ${currentCard.badgeColor}`}
                      >
                        {currentCard.badgeLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>وجه السؤال</span>
                      </span>
                    </div>

                    <div className="pt-2">
                      <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                        <MathText text={currentCard.frontTitle} />
                      </h3>

                      {currentCard.frontContent && (
                        <div className="mt-3 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <MathText text={currentCard.frontContent} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
                      <span>انقر بالماوس أو اضغط مسافة للقلب 🔄</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {currentIndex + 1} / {total}
                    </span>
                  </div>
                </div>

                {/* ---------------- BACK FACE ---------------- */}
                <div
                  className={`p-6 md:p-8 flex flex-col justify-between h-full ${
                    !isFlipped ? 'hidden' : 'block'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        الشرح والإجابة النموذجية 💡
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ظهر البطاقة</span>
                      </span>
                    </div>

                    <div className="pt-1 space-y-3">
                      <div className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        <MathText text={currentCard.backContent} />
                      </div>

                      {/* Key Takeaway Box */}
                      {currentCard.keyTakeaway && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-black mb-0.5">خلاصة الفهم (Key Takeaway):</strong>
                            <MathText text={currentCard.keyTakeaway} />
                          </div>
                        </div>
                      )}

                      {/* Extra Solution Box (e.g. final answer) */}
                      {currentCard.extra && (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          <MathText text={currentCard.extra} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                      <span>انقر للعودة لوجه السؤال ↺</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {currentIndex + 1} / {total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || total === 0}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* Quick Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFlip}
              className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'إظهار السؤال' : 'قلب ومعرفة الإجابة'}</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex >= total - 1 || total === 0}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
