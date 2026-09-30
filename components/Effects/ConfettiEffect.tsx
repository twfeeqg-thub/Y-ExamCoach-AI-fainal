'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export type ConfettiType = 'correct' | 'streak' | 'lessonComplete' | 'levelUp';

export interface ConfettiEventDetail {
  type?: ConfettiType;
  x?: number;
  y?: number;
}

const CONFETTI_EVENT = 'aadir:trigger-confetti';

/**
 * Programmatic helper to trigger confetti anywhere in the app
 */
export function triggerConfetti(
  type: ConfettiType = 'correct',
  coords?: { x?: number; y?: number }
): void {
  if (typeof window === 'undefined') return;

  try {
    const origin = {
      x: coords?.x !== undefined ? coords.x : 0.5,
      y: coords?.y !== undefined ? coords.y : 0.7,
    };

    switch (type) {
      case 'correct':
        // Cheerful lightweight particle burst
        confetti({
          particleCount: 50,
          spread: 65,
          origin,
          ticks: 200,
          gravity: 1.1,
          scalar: 0.9,
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'],
          disableForReducedMotion: true,
        });
        break;

      case 'streak':
        // Dynamic twin cannons from left and right
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.65 },
          colors: ['#F59E0B', '#EF4444', '#F97316', '#EAB308'],
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.65 },
          colors: ['#F59E0B', '#EF4444', '#F97316', '#EAB308'],
          disableForReducedMotion: true,
        });
        break;

      case 'lessonComplete':
        // Grand multi-phase celebratory explosion
        {
          const end = Date.now() + 1000;
          const colors = ['#10B981', '#065F46', '#34D399', '#FBBF24', '#60A5FA'];

          (function frame() {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors,
              disableForReducedMotion: true,
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors,
              disableForReducedMotion: true,
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          })();

          // Center burst
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
            });
          }, 300);
        }
        break;

      case 'levelUp':
        // Upward royal stars & gold burst
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.65 },
          ticks: 250,
          gravity: 0.9,
          scalar: 1.1,
          colors: ['#F59E0B', '#EAB308', '#FDE047', '#3B82F6', '#8B5CF6'],
          shapes: ['circle', 'square'],
          disableForReducedMotion: true,
        });
        break;

      default:
        confetti({
          particleCount: 40,
          spread: 60,
          origin,
        });
    }
  } catch {
    // Fallback if canvas-confetti fails or reduced-motion is requested
  }
}

/**
 * Event-based listener component mounted in root layout / main page.
 */
export const ConfettiEffect: React.FC = () => {
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const custom = e as CustomEvent<ConfettiEventDetail>;
      const detail = custom.detail || {};
      triggerConfetti(detail.type || 'correct', {
        x: detail.x,
        y: detail.y,
      });
    };

    window.addEventListener(CONFETTI_EVENT, handleTrigger);
    return () => {
      window.removeEventListener(CONFETTI_EVENT, handleTrigger);
    };
  }, []);

  return null;
};
