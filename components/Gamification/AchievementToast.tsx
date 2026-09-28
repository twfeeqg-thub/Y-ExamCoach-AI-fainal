'use client';

import React, { useState, useEffect } from 'react';
import { GamificationEventResult, Badge } from '@/types/index';
import {
  Award,
  Crown,
  Sparkles,
  X,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'level' | 'badge';
  title: string;
  description: string;
  badge?: Badge;
  level?: number;
}

export const AchievementToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleCelebrate = (e: Event) => {
      const customEvent = e as CustomEvent<GamificationEventResult>;
      const result = customEvent.detail;
      if (!result) return;

      const newItems: ToastItem[] = [];

      // 1. Level up item
      if (result.newLevel) {
        newItems.push({
          id: 'lvl-' + Date.now() + '-' + Math.random(),
          type: 'level',
          title: `ارتقاء في المستوى! 🎉`,
          description: `تهانينا! لقد صعدت إلى المستوى ${result.newLevel} بفضل استمرارك واجتهادك الذاتي.`,
          level: result.newLevel,
        });
      }

      // 2. Newly unlocked badges
      if (result.newBadges && result.newBadges.length > 0) {
        result.newBadges.forEach((badge) => {
          newItems.push({
            id: 'bdg-' + badge.id + '-' + Date.now(),
            type: 'badge',
            title: `وسام جديد مفتوح: ${badge.title} 🏅`,
            description: badge.description,
            badge,
          });
        });
      }

      if (newItems.length > 0) {
        setToasts((prev) => [...prev, ...newItems]);
      }
    };

    window.addEventListener('aadir:gamification:celebrate', handleCelebrate);
    return () => {
      window.removeEventListener('aadir:gamification:celebrate', handleCelebrate);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 text-white border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-300 flex items-start gap-3.5 relative overflow-hidden"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

          {/* Icon Shield */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            {toast.type === 'level' ? (
              <Crown className="w-6 h-6" />
            ) : (
              <Award className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-black text-amber-300">
                {toast.title}
              </h4>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {toast.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
