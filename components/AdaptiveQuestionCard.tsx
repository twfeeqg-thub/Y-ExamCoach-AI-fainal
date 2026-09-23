'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Question, CorrectOption } from '@/types/index';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Target,
  Brain,
  Sparkles,
  BookOpen,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// LaTeX Renderer (client-side, offline-capable via bundled katex)
// ---------------------------------------------------------------------------

const INLINE_MATH_DELIM = '\\(';
const DISPLAY_MATH_DELIM = '$$';

function renderLatex(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      displayMode,
      throwOnError: false,
      output: 'html',
      strict: false,
    });
  } catch {
    try {
      return katex.renderToString(content.replace(/[{}]/g, ''), {
        displayMode,
        throwOnError: false,
      });
    } catch {
      return content;
    }
  }
}

export const LaTeXText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const nodes = useMemo(() => {
    const tokens = text.split(/(\$\$.+?\$\$|\\\(.+?\\\))/g);
    return tokens.map((token, i) => {
      if (token.startsWith(DISPLAY_MATH_DELIM) && token.endsWith(DISPLAY_MATH_DELIM)) {
        const body = token.slice(2, -2);
        return (
          <span
            key={i}
            className="inline-block overflow-x-auto max-w-full py-1 px-2 my-1 bg-white/70 dark:bg-slate-800/60 rounded-xl"
            dangerouslySetInnerHTML={{ __html: renderLatex(body, true) }}
          />
        );
      }
      if (token.startsWith(INLINE_MATH_DELIM) && token.endsWith(')')) {
        const body = token.slice(2, -2);
        return (
          <span
            key={i}
            className="inline-block align-middle px-1"
            dangerouslySetInnerHTML={{ __html: renderLatex(body, false) }}
          />
        );
      }
      return (
        <React.Fragment key={i}>
          {token.split('\n').map((line, li, arr) => (
            <React.Fragment key={li}>
              {line}
              {li < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    });
  }, [text]);

  return <span className={className}>{nodes}</span>;
};

// ---------------------------------------------------------------------------
// Difficulty Badge
// ---------------------------------------------------------------------------

function getDifficultyBadge(difficulty: string) {
  if (difficulty === 'easy') {
    return (
      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>سهل</span>
      </span>
    );
  }
  if (difficulty === 'hard') {
    return (
      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>صعب / متقدم</span>
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      <span>متوسط</span>
    </span>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Adaptive Question Card
// ---------------------------------------------------------------------------

interface AdaptiveQuestionCardProps {
  question: Question;
  onAnswered: (
    selectedOption: CorrectOption,
    timeTakenSeconds: number,
    hintUsed: boolean
  ) => Promise<void> | void;
  questionIndex: number;
}

export const AdaptiveQuestionCard: React.FC<AdaptiveQuestionCardProps> = ({
  question,
  onAnswered,
  questionIndex,
}) => {
  const [selected, setSelected] = useState<CorrectOption | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const answeringRef = useRef<boolean>(false);

  // Timer: counts solve time in seconds until the answer is locked
  useEffect(() => {
    if (answered) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [answered, question.id]);

  // Reset local state when a new question arrives
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setHintUsed(false);
    setHintRevealed(false);
    setSeconds(0);
    answeringRef.current = false;
  }, [question.id]);

  const handleChoice = async (opt: CorrectOption) => {
    if (answered || answeringRef.current) return;
    answeringRef.current = true;
    setSelected(opt);
    setAnswered(true);
    await onAnswered(opt, seconds, hintUsed);
    answeringRef.current = false;
  };

  const revealHint = () => {
    if (hintRevealed || answered) return;
    setHintRevealed(true);
    setHintUsed(true);
  };

  const isCorrect = answered && selected === question.correctOption;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm transition-all relative space-y-4">
      {/* Header: index, timer, objective & difficulty badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black">
            سؤال {questionIndex}
          </span>

          {question.learningObjectiveCode && (
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 font-bold">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">{question.learningObjectiveCode}</span>
            </span>
          )}

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{question.subject}</span>
          </span>

          {getDifficultyBadge(question.estimatedDifficulty)}
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-sm ${
            seconds >= (question.expectedTime || 60)
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{formatElapsed(seconds)}</span>
        </div>
      </div>

      {/* Question Text + Math */}
      <div className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed pt-1">
        <LaTeXText text={question.questionText} />
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {([
          { key: 'A', text: question.optionA },
          { key: 'B', text: question.optionB },
          { key: 'C', text: question.optionC },
          { key: 'D', text: question.optionD },
        ] as { key: CorrectOption; text: string | null }[])
          .filter((opt) => opt.text && opt.text.trim().length > 0)
          .map((opt) => {
            const isCorrectOpt = question.correctOption === opt.key;
            const isSelectedWrong = answered && selected === opt.key && !isCorrectOpt;
            const isSelected = answered && selected === opt.key;

            let cardStyles =
              'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium';
            if (!answered && !isSelected) {
              cardStyles =
                'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer active:scale-[0.99]';
            }
            if (answered && isCorrectOpt) {
              cardStyles =
                'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20';
            }
            if (isSelectedWrong) {
              cardStyles =
                'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100 font-bold ring-2 ring-rose-500/20';
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={answered}
                onClick={() => handleChoice(opt.key)}
                className={`p-3.5 md:p-4 rounded-2xl border flex items-center justify-between transition-all min-h-[52px] text-right ${cardStyles} disabled:opacity-100`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      (answered && isCorrectOpt) || isSelectedWrong
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm md:text-base leading-snug">
                    <LaTeXText text={opt.text} />
                  </span>
                </div>

                {answered && isCorrectOpt && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {isSelectedWrong && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
      </div>

      {/* Hint Section */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {question.hint && (
          <>
            <button
              type="button"
              onClick={revealHint}
              disabled={answered}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition min-h-[44px] ${
                hintRevealed
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 cursor-default'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>{hintRevealed ? 'تم إظهار التلميح' : 'إظهار التلميح'}</span>
            </button>

            {hintRevealed && (
              <div className="flex-1 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 animate-in fade-in duration-200">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">تلميح تربوي: </span>
                  <span>
                    <LaTeXText text={question.hint} />
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diagnostic Feedback */}
      {answered && (
        <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
          <div
            className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs md:text-sm ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-100'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {isCorrect
                  ? 'إجابة صحيحة! أحسنت التركيز. ✨'
                  : `إجابة خاطئة. الإجابة الصحيحة هي الخيار ${question.correctOption}.`}
              </p>

              {/* Diagnostic feedback for the wrong selection */}
              {!isCorrect && selected && question.wrongExplanations?.[selected] && (
                <p className="leading-relaxed flex items-start gap-1.5">
                  <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-bold">التفنيد التشخيصي لاختيارك ({selected}): </span>
                    {question.wrongExplanations[selected]}
                  </span>
                </p>
              )}

              <p className="leading-relaxed">{question.correctExplanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveQuestionCard;