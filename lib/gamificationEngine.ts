/**
 * Smart Exam Engine - Local Offline-First Gamification & Self-Motivation Engine
 * 
 * LocalStorage Key: aadir.gamification.store
 * Self-motivation focus: personal streaks, XP progression, and mastery badges
 * without public or demotivating leaderboards.
 */

import {
  Badge,
  BadgeCategory,
  StudentGamificationState,
  GamificationEventResult,
} from '@/types/index';
import { toLocalDayKey } from './studyTracker';

const LS_GAMIFICATION = 'aadir.gamification.store';

// ---------------------------------------------------------------------------
// Standard Badge Catalog (Immutable Definitions)
// ---------------------------------------------------------------------------

export const BADGE_CATALOG: Badge[] = [
  {
    id: 'first_step',
    title: 'الخطوة الأولى',
    description: 'إنجاز أول سؤال صحيح أو قراءة أول درس بتأنٍ',
    category: 'explorer',
    icon: 'Compass',
    condition: 'حل أول سؤال بشكل صحيح أو قراءة درس تعليمي',
  },
  {
    id: 'streak_2',
    title: 'شعلة البداية',
    description: 'المواظبة على الدراسة ليومين متتاليين',
    category: 'streak',
    icon: 'Flame',
    condition: 'المذاكرة ليومين متتاليين',
  },
  {
    id: 'streak_5',
    title: 'طالب مثالي',
    description: 'الاستمرار في المذاكرة لـ 5 أيام متتالية دون انقطاع',
    category: 'streak',
    icon: 'Zap',
    condition: 'المذاكرة لـ 5 أيام متتالية',
  },
  {
    id: 'streak_10',
    title: 'العزيمة الفولاذية',
    description: 'سلسلة دراسية ملهمة لـ 10 أيام متتالية',
    category: 'streak',
    icon: 'Crown',
    condition: 'المذاكرة لـ 10 أيام متتالية',
  },
  {
    id: 'math_explorer',
    title: 'فارس الرياضيات',
    description: 'التقدم وحل 5 أسئلة أو قراءة دروس في الرياضيات',
    category: 'subject',
    icon: 'Sigma',
    condition: 'إنجاز 5 نشاطات في مادة الرياضيات',
  },
  {
    id: 'physics_hero',
    title: 'بطل الفيزياء',
    description: 'التقدم وحل 5 أسئلة أو قراءة دروس في الفيزياء',
    category: 'subject',
    icon: 'Atom',
    condition: 'إنجاز 5 نشاطات في مادة الفيزياء',
  },
  {
    id: 'mastery_maker',
    title: 'صانع الإتقان',
    description: 'تحقيق نسبة إتقان 80% فما فوق في أحد مخرجات التعلم',
    category: 'mastery',
    icon: 'Target',
    condition: 'الوصول لنسبة إتقان 80% في هدف تعليمي',
  },
  {
    id: 'knowledge_seeker',
    title: 'قارئ المعرفة',
    description: 'إكمال قراءة واستيعاب درسين تعليميين بالكامل',
    category: 'milestone',
    icon: 'BookOpenCheck',
    condition: 'إكمال قراءة درسين تعليميين',
  },
  {
    id: 'persistent_mind',
    title: 'العقل المتجدد',
    description: 'تجميع 200 نقطة خبرة (XP) بالجهد الذاتي المستمر',
    category: 'milestone',
    icon: 'Sparkles',
    condition: 'الوصول إلى 200 نقطة خبرة (XP)',
  },
];

// ---------------------------------------------------------------------------
// Safe Storage Helpers (SSR & Privacy Mode Tolerant)
// ---------------------------------------------------------------------------

function storageGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function storageSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Gracefully ignore quota / private-browsing errors
  }
}

// ---------------------------------------------------------------------------
// Level Calculation Formulas
// ---------------------------------------------------------------------------

/**
 * Level = floor(sqrt(XP / 50)) + 1
 */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

/**
 * Calculates base XP of current level and target XP for next level.
 */
export function calculateLevelBounds(level: number): {
  currentBaseXP: number;
  nextLevelXP: number;
} {
  const currentBaseXP = Math.pow(level - 1, 2) * 50;
  const nextLevelXP = Math.pow(level, 2) * 50;
  return { currentBaseXP, nextLevelXP };
}

/**
 * Calculates completion percentage toward the next level (0 - 100).
 */
export function calculateLevelProgress(xp: number, level: number): number {
  const { currentBaseXP, nextLevelXP } = calculateLevelBounds(level);
  const span = nextLevelXP - currentBaseXP;
  if (span <= 0) return 100;
  const currentInLevel = Math.max(0, xp - currentBaseXP);
  return Math.min(100, Math.round((currentInLevel / span) * 100));
}

// ---------------------------------------------------------------------------
// State Access & Initialization
// ---------------------------------------------------------------------------

const DEFAULT_STATE: StudentGamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  unlockedBadges: [],
  lastActiveDate: undefined,
  totalCorrect: 0,
  completedLessonIds: [],
  subjectCounts: {},
  maxMasteryScore: 0,
};

export function getGamificationState(): StudentGamificationState {
  const saved = storageGet<StudentGamificationState>(LS_GAMIFICATION);
  if (!saved) return { ...DEFAULT_STATE };
  return {
    ...DEFAULT_STATE,
    ...saved,
    level: calculateLevel(saved.xp || 0),
    unlockedBadges: Array.isArray(saved.unlockedBadges) ? saved.unlockedBadges : [],
    completedLessonIds: Array.isArray(saved.completedLessonIds) ? saved.completedLessonIds : [],
    subjectCounts: saved.subjectCounts || {},
  };
}

export function saveGamificationState(state: StudentGamificationState): void {
  storageSet(LS_GAMIFICATION, state);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('aadir:gamification:updated', { detail: state })
      );
    } catch {
      // Ignore dispatch failures
    }
  }
}

// ---------------------------------------------------------------------------
// Streak Calculation (Daily Local Calendar)
// ---------------------------------------------------------------------------

export function recordDailyStreak(
  state: StudentGamificationState
): { updated: boolean; bonusXP: number } {
  const today = toLocalDayKey(new Date());
  const lastActive = state.lastActiveDate;

  if (lastActive === today) {
    // Already active today; streak remains unchanged
    return { updated: false, bonusXP: 0 };
  }

  let streakUpdated = false;
  let bonusXP = 0;

  if (!lastActive) {
    // First time studying ever
    state.currentStreak = 1;
    state.longestStreak = 1;
    state.lastActiveDate = today;
    bonusXP = 50; // Welcome daily streak bonus
    streakUpdated = true;
  } else {
    // Compute day difference
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day!
      state.currentStreak += 1;
      state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
      state.lastActiveDate = today;
      bonusXP = 50; // Daily streak bonus
      streakUpdated = true;
    } else if (diffDays > 1) {
      // Streak broken, restart
      state.currentStreak = 1;
      state.lastActiveDate = today;
      bonusXP = 50; // Restart encouragement bonus
      streakUpdated = true;
    }
  }

  return { updated: streakUpdated, bonusXP };
}

// ---------------------------------------------------------------------------
// Badge Evaluation Logic
// ---------------------------------------------------------------------------

export interface GamificationEventContext {
  type?: 'answer' | 'lesson' | 'sync';
  isCorrect?: boolean;
  subject?: string;
  lessonId?: string;
  masteryScore?: number;
}

export function checkAndUnlockBadges(
  state: StudentGamificationState,
  context?: GamificationEventContext
): Badge[] {
  const newlyUnlocked: Badge[] = [];
  const currentUnlockedSet = new Set(state.unlockedBadges || []);

  const unlock = (badgeId: string) => {
    if (!currentUnlockedSet.has(badgeId)) {
      currentUnlockedSet.add(badgeId);
      state.unlockedBadges = Array.from(currentUnlockedSet);
      const badgeDef = BADGE_CATALOG.find((b) => b.id === badgeId);
      if (badgeDef) {
        newlyUnlocked.push({
          ...badgeDef,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  };

  // 1. First Step (أي إجابة صحيحة أو درس مكتمل)
  if ((state.totalCorrect || 0) >= 1 || (state.completedLessonIds || []).length >= 1) {
    unlock('first_step');
  }

  // 2. Streak Badges
  if (state.currentStreak >= 2) unlock('streak_2');
  if (state.currentStreak >= 5) unlock('streak_5');
  if (state.currentStreak >= 10) unlock('streak_10');

  // 3. Subject Badges (5 activities in subject)
  const mathActivities = state.subjectCounts?.['الرياضيات'] || 0;
  if (mathActivities >= 5) unlock('math_explorer');

  const physicsActivities = state.subjectCounts?.['الفيزياء'] || 0;
  if (physicsActivities >= 5) unlock('physics_hero');

  // 4. Mastery Maker (80%+ mastery score)
  if ((state.maxMasteryScore || 0) >= 80 || (context?.masteryScore || 0) >= 80) {
    unlock('mastery_maker');
  }

  // 5. Knowledge Seeker (2 completed lessons)
  if ((state.completedLessonIds || []).length >= 2) {
    unlock('knowledge_seeker');
  }

  // 6. Persistent Mind (>= 200 XP)
  if (state.xp >= 200) {
    unlock('persistent_mind');
  }

  return newlyUnlocked;
}

// ---------------------------------------------------------------------------
// Core Event Processors (XP, Level, Badges, Celebrate)
// ---------------------------------------------------------------------------

export function addXPAndCheckBadges(
  xpAmount: number,
  context: GamificationEventContext = {}
): GamificationEventResult {
  const state = getGamificationState();
  const prevLevel = state.level;

  // 1. Process Streak
  const streakResult = recordDailyStreak(state);
  const totalXPGained = xpAmount + streakResult.bonusXP;

  // 2. Add XP and recalculate level
  state.xp = Math.max(0, state.xp + totalXPGained);
  const newLevel = calculateLevel(state.xp);
  state.level = newLevel;

  // 3. Update contextual statistics
  if (context.isCorrect) {
    state.totalCorrect = (state.totalCorrect || 0) + 1;
  }
  if (context.subject) {
    state.subjectCounts = state.subjectCounts || {};
    state.subjectCounts[context.subject] = (state.subjectCounts[context.subject] || 0) + 1;
  }
  if (context.lessonId && !state.completedLessonIds?.includes(context.lessonId)) {
    state.completedLessonIds = [...(state.completedLessonIds || []), context.lessonId];
  }
  if (context.masteryScore && context.masteryScore > (state.maxMasteryScore || 0)) {
    state.maxMasteryScore = context.masteryScore;
  }

  // 4. Check for newly unlocked badges
  const newBadges = checkAndUnlockBadges(state, context);

  // 5. Save state and broadcast update
  saveGamificationState(state);

  const result: GamificationEventResult = {
    xpGained: totalXPGained,
    newLevel: newLevel > prevLevel ? newLevel : undefined,
    newBadges,
    streakUpdated: streakResult.updated,
  };

  // 6. Fire celebration event if a milestone was reached
  if (typeof window !== 'undefined' && (result.newLevel || result.newBadges.length > 0)) {
    try {
      window.dispatchEvent(
        new CustomEvent('aadir:gamification:celebrate', { detail: result })
      );
    } catch {
      // Ignore
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Silent Trigger Shortcuts for Adaptive Practice & Lessons
// ---------------------------------------------------------------------------

/**
 * Triggers gamification update when student answers a question.
 * Correct answer = +10 XP.
 * Wrong answer = 0 XP (no penalty to encourage risk-free practice).
 */
export function triggerAnswerGamification(
  isCorrect: boolean,
  subject: string,
  masteryScore?: number
): GamificationEventResult {
  const baseXP = isCorrect ? 10 : 0;
  return addXPAndCheckBadges(baseXP, {
    type: 'answer',
    isCorrect,
    subject,
    masteryScore,
  });
}

/**
 * Triggers gamification update when student finishes reading a lesson (+25 XP).
 */
export function triggerLessonGamification(
  lessonId: string,
  subject: string
): GamificationEventResult {
  return addXPAndCheckBadges(25, {
    type: 'lesson',
    lessonId,
    subject,
  });
}

/**
 * Returns full badges with their unlocked status merged.
 */
export function getAllBadgesWithStatus(state?: StudentGamificationState): {
  unlocked: Badge[];
  locked: Badge[];
  all: Badge[];
} {
  const currentState = state || getGamificationState();
  const unlockedSet = new Set(currentState.unlockedBadges || []);

  const all = BADGE_CATALOG.map((badge) => {
    const isUnlocked = unlockedSet.has(badge.id);
    return {
      ...badge,
      unlockedAt: isUnlocked ? badge.unlockedAt || currentState.lastActiveDate || 'مكتسب' : undefined,
    };
  });

  const unlocked = all.filter((b) => unlockedSet.has(b.id));
  const locked = all.filter((b) => !unlockedSet.has(b.id));

  return { unlocked, locked, all };
}
