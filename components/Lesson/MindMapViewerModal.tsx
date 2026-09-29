'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson } from '@/types/index';
import { MathText } from '@/components/MathText';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Brain,
  HelpCircle,
  Lightbulb,
  FileText,
  Target,
  Clock,
  Compass,
} from 'lucide-react';

export interface MindMapViewerModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MindMapViewerModal: React.FC<MindMapViewerModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({
    concepts: false,
    mistakes: false,
    examples: false,
    recall: false,
  });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setCollapsedBranches({
        concepts: false,
        mistakes: false,
        examples: false,
        recall: false,
      });
      setExpandedNodes({});
    }
  }, [isOpen, lesson]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') setZoomLevel((z) => Math.min(150, z + 10));
      else if (e.key === '-') setZoomLevel((z) => Math.max(70, z - 10));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleBranch = (key: string) => {
    setCollapsedBranches((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    setCollapsedBranches({
      concepts: false,
      mistakes: false,
      examples: false,
      recall: false,
    });
    // Expand all sub-nodes
    const allExpanded: Record<string, boolean> = {};
    if (lesson?.content?.coreConcepts) {
      lesson.content.coreConcepts.forEach((_, i) => (allExpanded[`c-${i}`] = true));
    }
    if (lesson?.content?.solvedExamples) {
      lesson.content.solvedExamples.forEach((_, i) => (allExpanded[`ex-${i}`] = true));
    }
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    setCollapsedBranches({
      concepts: true,
      mistakes: true,
      examples: true,
      recall: true,
    });
    setExpandedNodes({});
  };

  if (!isOpen || !lesson) return null;

  const content = lesson.content || {
    introduction: '',
    coreConcepts: [],
    commonMistakes: [],
    solvedExamples: [],
    activeRecallSummary: '',
  };

  const coreConceptsCount = content.coreConcepts?.length || 0;
  const commonMistakesCount = content.commonMistakes?.length || 0;
  const solvedExamplesCount = content.solvedExamples?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100">
                  الخريطة الذهنية التفاعلية للدرس (Mind Map)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-[10px]">
                  هيكل بصري شجري
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                درس: {lesson.lessonTitle} • {lesson.subject} (الصف {lesson.grade})
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-600 dark:text-slate-300"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-[11px] text-slate-700 dark:text-slate-200 select-none">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-600 dark:text-slate-300"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-600"
                title="إعادة التكبير للطبيعي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expand / Collapse All */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 text-[11px]"
                title="توسيع كافة الفروع"
              >
                <Maximize2 className="w-3 h-3" />
                <span>توسيع الكل</span>
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 text-[11px]"
                title="طي كافة الفروع"
              >
                <Minimize2 className="w-3 h-3" />
                <span>طي الكل</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mind Map Canvas / Interactive Tree View */}
        <div className="flex-1 overflow-auto p-6 md:p-10 select-none relative bg-slate-50 dark:bg-slate-950">
          <div
            className="w-full mx-auto transition-transform duration-200 origin-top space-y-8"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* 1. ROOT NODE: Unit & Subject */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="px-6 py-3.5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 border-2 border-white/30 flex items-center gap-3 text-center">
                  <BookOpen className="w-6 h-6 text-amber-300 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 block">
                      الوحدة الدراسية • {lesson.subject}
                    </span>
                    <span className="text-base md:text-lg font-black tracking-tight">
                      {lesson.unitTitle || lesson.subject}
                    </span>
                  </div>
                </div>
                {/* Connector Line to Lesson Node */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 mx-auto" />
              </div>

              {/* 2. SUB-ROOT NODE: Lesson Title & Target Objectives */}
              <div className="max-w-2xl w-full p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 shadow-lg text-center space-y-3 relative">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[11px]">
                    الدرس #{lesson.lessonOrder || 1}: {lesson.lessonTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">
                    الصف {lesson.grade} {lesson.section ? `• ${lesson.section}` : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{lesson.estimatedReadingTimeMinutes || 10} دقيقة</span>
                  </span>
                </div>

                {lesson.content?.introduction && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto line-clamp-2">
                    {lesson.content.introduction}
                  </p>
                )}

                {/* Target Learning Objectives */}
                {lesson.learningObjectiveCodes && lesson.learningObjectiveCodes.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400">مخرجات التعلم:</span>
                    {lesson.learningObjectiveCodes.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-900"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Trunk Splitting Connector */}
              <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700 mx-auto" />
            </div>

            {/* 3. MAIN BRANCHES (Interactive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {/* ================= BRANCH 1: CORE CONCEPTS ================= */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-md overflow-hidden transition-all duration-200">
                {/* Branch Header */}
                <div
                  onClick={() => toggleBranch('concepts')}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                        المفاهيم والنظريات المركزية
                      </h4>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {coreConceptsCount} مفاهيم أساسية
                      </span>
                    </div>
                  </div>

                  <button className="text-emerald-700 dark:text-emerald-300 p-1">
                    {collapsedBranches.concepts ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Branch Content */}
                {!collapsedBranches.concepts && (
                  <div className="p-4 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10">
                    {coreConceptsCount === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        لا توجد مفاهيم مسجلة في هذا الدرس.
                      </p>
                    ) : (
                      content.coreConcepts.map((concept, i) => {
                        const isExpanded = expandedNodes[`c-${i}`];
                        return (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-3.5 space-y-2 shadow-xs transition hover:shadow-sm"
                          >
                            <div
                              onClick={() => toggleNode(`c-${i}`)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-black flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                  {concept.conceptTitle}
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {isExpanded ? 'طي' : 'تفاصيل'}
                              </span>
                            </div>

                            {/* Node Body */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                  <MathText text={concept.explanation} />
                                </div>

                                {concept.keyTakeaway && (
                                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-black">خلاصة: </strong>
                                      <MathText text={concept.keyTakeaway} inline />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* ================= BRANCH 2: COMMON MISTAKES ================= */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-md overflow-hidden transition-all duration-200">
                {/* Branch Header */}
                <div
                  onClick={() => toggleBranch('mistakes')}
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-b border-amber-100 dark:border-amber-900/50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                        الأخطاء الشائعة والفخاخ الامتحانية
                      </h4>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                        {commonMistakesCount} تنبيهات نموذجية
                      </span>
                    </div>
                  </div>

                  <button className="text-amber-700 dark:text-amber-300 p-1">
                    {collapsedBranches.mistakes ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Branch Content */}
                {!collapsedBranches.mistakes && (
                  <div className="p-4 space-y-3 bg-amber-50/20 dark:bg-amber-950/10">
                    {commonMistakesCount === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        لا توجد تحذيرات مسجلة في هذا الدرس.
                      </p>
                    ) : (
                      content.commonMistakes.map((mistake, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-900/90 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-3.5 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span>تحذير امتحاني:</span>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            <MathText text={mistake} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ================= BRANCH 3: SOLVED EXAMPLES ================= */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-md overflow-hidden transition-all duration-200">
                {/* Branch Header */}
                <div
                  onClick={() => toggleBranch('examples')}
                  className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                        الأمثلة المحلولة خطوة بخطوة
                      </h4>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold">
                        {solvedExamplesCount} مسائل تطبيقية
                      </span>
                    </div>
                  </div>

                  <button className="text-indigo-700 dark:text-indigo-300 p-1">
                    {collapsedBranches.examples ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Branch Content */}
                {!collapsedBranches.examples && (
                  <div className="p-4 space-y-3 bg-indigo-50/20 dark:bg-indigo-950/10">
                    {solvedExamplesCount === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        لا توجد مسائل محلولة مسجلة في هذا الدرس.
                      </p>
                    ) : (
                      content.solvedExamples.map((ex, i) => {
                        const isExpanded = expandedNodes[`ex-${i}`];
                        return (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-900/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-3.5 space-y-2 shadow-xs transition hover:shadow-sm"
                          >
                            <div
                              onClick={() => toggleNode(`ex-${i}`)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-black flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                                  {ex.exampleText}
                                </span>
                              </div>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                {isExpanded ? 'طي الحل' : 'عرض الحل'}
                              </span>
                            </div>

                            {/* Node Solution */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <strong className="block text-indigo-600 dark:text-indigo-400 mb-1">
                                    خطوات الحل:
                                  </strong>
                                  <MathText text={ex.stepByStepSolution} />
                                </div>

                                {ex.finalAnswer && (
                                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                    <span>الجواب النهائي: </span>
                                    <MathText text={ex.finalAnswer} inline />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 4. ACTIVE RECALL SUMMARY BANNER */}
            {content.activeRecallSummary && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-900/60 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs md:text-sm font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <span>خلاصة الاستدعاء النشط والمراجعة السريعة (Active Recall Summary):</span>
                  </h4>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <MathText text={content.activeRecallSummary} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>يمكنك النقر على أي عقدة لفتح تفاصيلها أو إغلاقها، واستخدام أدوات التكبير والتصغير.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
