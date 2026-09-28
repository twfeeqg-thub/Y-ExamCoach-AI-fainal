'use client';

import React, { useState } from 'react';
import { useGamification } from '@/lib/gamificationHook';
import { Badge, BadgeCategory } from '@/types/index';
import {
  X,
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Flame,
  Zap,
  Crown,
  Compass,
  Atom,
  Target,
  BookOpenCheck,
  Calculator,
  Layers,
} from 'lucide-react';

interface BadgesShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgesShowcaseModal: React.FC<BadgesShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allBadges, unlockedBadges, state } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'كل الأوسمة' },
    { id: 'explorer', label: 'المستكشف' },
    { id: 'streak', label: 'السلسلة اليومية' },
    { id: 'subject', label: 'المواد' },
    { id: 'mastery', label: 'الإتقان' },
    { id: 'milestone', label: 'المحطات' },
  ];

  const filteredBadges = allBadges.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category === selectedCategory;
  });

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-6 h-6" />;
      case 'Flame':
        return <Flame className="w-6 h-6" />;
      case 'Zap':
        return <Zap className="w-6 h-6" />;
      case 'Crown':
        return <Crown className="w-6 h-6" />;
      case 'Sigma':
        return <Calculator className="w-6 h-6" />;
      case 'Atom':
        return <Atom className="w-6 h-6" />;
      case 'Target':
        return <Target className="w-6 h-6" />;
      case 'BookOpenCheck':
        return <BookOpenCheck className="w-6 h-6" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  خزانة الأوسمة والإنجازات الذاتية
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-extrabold">
                  {unlockedBadges.length} / {allBadges.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تنافس مع نفسك وافتح أوسمة التميز والمثابرة بالاستمرار اليومي في التعلم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Motivational Stats Summary Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-around text-center text-xs">
          <div>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              نقاط الخبرة (XP)
            </span>
            <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
              {state.xp}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              المستوى الذاتي
            </span>
            <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
              Level {state.level}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              سلسلة الأيام
            </span>
            <span className="text-base font-black text-orange-600 dark:text-orange-400 font-mono">
              {state.currentStreak} يوم
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid View */}
        <div className="p-6 overflow-y-auto max-h-[55vh] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredBadges.map((badge) => {
            const isUnlocked = state.unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition relative overflow-hidden flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-900/10 border-amber-300 dark:border-amber-800 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                {/* Badge Icon Shield */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-5 h-5" />}
                </div>

                {/* Badge Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      className={`text-sm font-bold ${
                        isUnlocked
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {badge.title}
                    </h4>

                    {isUnlocked && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مفتوح</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {badge.description}
                  </p>

                  <div className="pt-1.5 flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-slate-400">الشرط:</span>
                    <span
                      className={`font-medium ${
                        isUnlocked
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {badge.condition}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>يتم تخزين تقدمك محلياً على جهازك ليعمل التطبيق بدون اتصال.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
