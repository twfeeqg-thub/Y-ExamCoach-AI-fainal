'use client';

import React from 'react';
import { useGamification } from '@/lib/gamificationHook';
import {
  Flame,
  Award,
  Sparkles,
  ChevronLeft,
  Crown,
  Zap,
} from 'lucide-react';

interface GamificationHeaderBarProps {
  onOpenBadges?: () => void;
  className?: string;
}

export const GamificationHeaderBar: React.FC<GamificationHeaderBarProps> = ({
  onOpenBadges,
  className = '',
}) => {
  const {
    state,
    levelProgress,
    currentBaseXP,
    nextLevelXP,
    unlockedBadges,
    allBadges,
    openBadgesModal,
  } = useGamification();

  const handleOpenBadges = onOpenBadges || openBadgesModal;

  const currentLevelXP = Math.max(0, state.xp - currentBaseXP);
  const neededLevelXP = nextLevelXP - currentBaseXP;

  return (
    <div
      className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 md:p-3 shadow-xs flex items-center justify-between gap-3 flex-wrap ${className}`}
    >
      {/* Left: Level Badge & XP Progress */}
      <div className="flex items-center gap-3 min-w-[200px] flex-1">
        {/* Glowing Level Shield */}
        <div className="relative group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black flex flex-col items-center justify-center shadow-md shadow-amber-500/20 border border-amber-300">
            <Crown className="w-3.5 h-3.5 text-amber-950 -mb-0.5" />
            <span className="text-xs font-black font-mono leading-none">{state.level}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>

        {/* Level Name & XP Progress Bar */}
        <div className="flex-1 min-w-[120px] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                المستوى {state.level}
              </span>
              <span className="text-slate-400 font-normal hidden sm:inline">• رصيدك:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {state.xp} XP
              </span>
            </div>

            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              {currentLevelXP}/{neededLevelXP} XP ({levelProgress}%)
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 transition-all duration-500 shadow-xs"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Controls: Streak & Badges Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Daily Streak Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
            state.currentStreak > 0
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}
          title={`أيام دراسية متتالية: ${state.currentStreak} يوم (أطول سلسلة: ${state.longestStreak} يوم)`}
        >
          <Flame
            className={`w-4 h-4 ${
              state.currentStreak > 0
                ? 'text-orange-500 fill-orange-500 animate-pulse'
                : 'text-slate-400'
            }`}
          />
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-sm">{state.currentStreak}</span>
            <span className="text-[10px] hidden sm:inline">أيام متتالية</span>
          </div>
        </div>

        {/* Badges Modal Trigger Button */}
        <button
          onClick={handleOpenBadges}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer text-xs font-bold"
          title="عرض خزانة الأوسمة والإنجازات الذاتية"
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>الأوسمة</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-mono text-[10px] font-extrabold">
            {unlockedBadges.length}/{allBadges.length}
          </span>
          <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </div>
  );
};
