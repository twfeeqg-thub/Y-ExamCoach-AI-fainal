/**
 * Sound Effects & Audio Preferences Manager
 * 
 * Built with Web Audio API for 100% offline, zero-latency, zero-asset audio synthesis.
 * Handles sound toggling and saves student preferences in localStorage.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const LS_SOUND_KEY = 'aadir.sound.enabled';
const SOUND_EVENT = 'aadir:sound-preference-changed';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Check if sound effects are enabled in user preferences (default: true) */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = window.localStorage.getItem(LS_SOUND_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

/** Update sound preference and dispatch change event */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_SOUND_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { enabled } }));
  } catch {
    // ignore quota/private mode
  }
}

/** Toggle current sound preference */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  if (next) {
    playCorrectAnswerSound(); // Brief confirmation chime
  }
  return next;
}

/** React hook for subscribing to sound preference */
export function useSoundPreference() {
  const [enabled, setEnabledState] = useState<boolean>(true);

  useEffect(() => {
    setEnabledState(isSoundEnabled());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setEnabledState(custom.detail.enabled);
      } else {
        setEnabledState(isSoundEnabled());
      }
    };

    window.addEventListener(SOUND_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SOUND_EVENT, handleUpdate);
    };
  }, []);

  const toggle = useCallback(() => {
    return toggleSound();
  }, []);

  const setPref = useCallback((val: boolean) => {
    setSoundEnabled(val);
  }, []);

  return { soundEnabled: enabled, toggleSound: toggle, setSoundEnabled: setPref };
}

// ---------------------------------------------------------------------------
// Synthesized Sound Effects (Pedagogical, Friendly & Lightweight)
// ---------------------------------------------------------------------------

/**
 * Correct Answer Chime:
 * Two-tone musical chime (E5 -> G#5 -> B5) with soft sine harmonics.
 */
export function playCorrectAnswerSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const notes = [
      { freq: 659.25, time: 0, duration: 0.18 },    // E5
      { freq: 830.61, time: 0.08, duration: 0.22 },  // G#5
      { freq: 987.77, time: 0.16, duration: 0.45 },  // B5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.linearRampToValueAtTime(0.2, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch {
    // ignore audio errors
  }
}

/**
 * Lesson Complete Cheer / Fanfare:
 * Bright multi-note celebratory chord progression (C5 -> E5 -> G5 -> C6).
 */
export function playLessonCompleteSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const chords = [
      { freq: 523.25, time: 0.0, dur: 0.25 },   // C5
      { freq: 659.25, time: 0.12, dur: 0.28 },  // E5
      { freq: 783.99, time: 0.24, dur: 0.35 },  // G5
      { freq: 1046.50, time: 0.38, dur: 0.8 },  // C6
      { freq: 1318.51, time: 0.42, dur: 0.9 },  // E6
    ];

    chords.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.linearRampToValueAtTime(0.25, now + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  } catch {
    // ignore audio errors
  }
}

/**
 * Level Up Shimmer Arpeggio:
 * Ascending pentatonic sparkle.
 */
export function playLevelUpSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  } catch {
    // ignore audio errors
  }
}

/**
 * Streak Milestone Sound (for 3, 5, 10 answers):
 * Fast energetic double-fanfare.
 */
export function playStreakSound(streak: number = 3): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const baseFreq = streak >= 10 ? 659.25 : streak >= 5 ? 587.33 : 523.25;

    const streakTones = [
      { freq: baseFreq, time: 0, dur: 0.15 },
      { freq: baseFreq * 1.25, time: 0.09, dur: 0.18 },
      { freq: baseFreq * 1.5, time: 0.18, dur: 0.22 },
      { freq: baseFreq * 2.0, time: 0.28, dur: 0.5 },
    ];

    streakTones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(tone.freq, now + tone.time);

      gain.gain.setValueAtTime(0.001, now + tone.time);
      gain.gain.linearRampToValueAtTime(0.22, now + tone.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.time + tone.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + tone.time);
      osc.stop(now + tone.time + tone.dur);
    });
  } catch {
    // ignore audio errors
  }
}

/**
 * Gentle Encouragement Sound (for incorrect answers):
 * Soft, low warm marimba chord - supportive without punitive buzzing.
 */
export function playGentleEncouragementSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const tones = [392.00, 329.63]; // G4 -> E4 gentle descending warm interval

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.38);
    });
  } catch {
    // ignore
  }
}
