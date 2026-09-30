'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  StudentGamificationState,
  GamificationEventResult,
} from '@/types/index';
import {
  DEFAULT_STATE,
  getGamificationState,
  calculateLevelBounds,
  calculateLevelProgress,
  getAllBadgesWithStatus,
  triggerAnswerGamification,
  triggerLessonGamification,
  addXPAndCheckBadges,
} from './gamificationEngine';

export interface UseGamificationReturn {
  state: StudentGamificationState;
  isMounted: boolean;
  levelProgress: number;
  currentBaseXP: number;
  nextLevelXP: number;
  allBadges: Badge[];
  unlockedBadges: Badge[];
  lockedBadges: Badge[];
  isBadgesModalOpen: boolean;
  openBadgesModal: () => void;
  closeBadgesModal: () => void;
  recordAnswer: (isCorrect: boolean, subject: string, masteryScore?: number) => GamificationEventResult;
  recordLessonCompletion: (lessonId: string, subject: string) => GamificationEventResult;
  refreshState: () => void;
}

export function useGamification(): UseGamificationReturn {
  const [state, setState] = useState<StudentGamificationState>(DEFAULT_STATE);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);

  const refreshState = useCallback(() => {
    setState(getGamificationState());
  }, []);

  useEffect(() => {
    setIsMounted(true);
    // Synchronize stored state from localStorage on client mount (avoids hydration mismatch)
    refreshState();

    const handleUpdate = () => {
      refreshState();
    };

    window.addEventListener('aadir:gamification:updated', handleUpdate);
    return () => {
      window.removeEventListener('aadir:gamification:updated', handleUpdate);
    };
  }, [refreshState]);

  const { currentBaseXP, nextLevelXP } = calculateLevelBounds(state.level);
  const levelProgress = calculateLevelProgress(state.xp, state.level);
  const { unlocked, locked, all } = getAllBadgesWithStatus(state);

  const openBadgesModal = useCallback(() => setIsBadgesModalOpen(true), []);
  const closeBadgesModal = useCallback(() => setIsBadgesModalOpen(false), []);

  const recordAnswer = useCallback(
    (isCorrect: boolean, subject: string, masteryScore?: number) => {
      const res = triggerAnswerGamification(isCorrect, subject, masteryScore);
      refreshState();
      return res;
    },
    [refreshState]
  );

  const recordLessonCompletion = useCallback(
    (lessonId: string, subject: string) => {
      const res = triggerLessonGamification(lessonId, subject);
      refreshState();
      return res;
    },
    [refreshState]
  );

  return {
    state,
    isMounted,
    levelProgress,
    currentBaseXP,
    nextLevelXP,
    allBadges: all,
    unlockedBadges: unlocked,
    lockedBadges: locked,
    isBadgesModalOpen,
    openBadgesModal,
    closeBadgesModal,
    recordAnswer,
    recordLessonCompletion,
    refreshState,
  };
}
