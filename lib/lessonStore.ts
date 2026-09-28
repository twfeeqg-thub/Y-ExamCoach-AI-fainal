/**
 * Offline-First Lesson Store
 * Local storage persistence, caching, and network synchronization
 * Stage C2 - Hybrid Lesson Intake Engine
 */

import { Lesson, Grade } from '@/types/index';

const LS_LESSONS_CACHE = 'aadir.lessons.cache.v1';
const LS_LAST_SYNC = 'aadir.lessons.last_sync';

// In-memory fallback if LocalStorage is disabled or in private browsing
let memLessonsCache: Lesson[] = [];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeGetStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeSetStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or disabled
  }
}

/**
 * Retrieve cached lessons from local storage with optional filters
 */
export function getStoredLessons(filters?: {
  subject?: string;
  grade?: Grade | number;
  section?: string;
}): Lesson[] {
  const all = isBrowser()
    ? safeGetStorage<Lesson[]>(LS_LESSONS_CACHE, memLessonsCache)
    : memLessonsCache;

  let filtered = all;

  if (filters?.grade) {
    filtered = filtered.filter((l) => l.grade === filters.grade);
  }

  if (filters?.subject && filters.subject !== 'all') {
    filtered = filtered.filter((l) => l.subject === filters.subject);
  }

  if (filters?.section && filters.section !== 'all') {
    filtered = filtered.filter((l) => !l.section || l.section === filters.section);
  }

  // Sort by unitOrder ASC, lessonOrder ASC
  return filtered.sort((a, b) => {
    if (a.unitOrder !== b.unitOrder) return a.unitOrder - b.unitOrder;
    return a.lessonOrder - b.lessonOrder;
  });
}

/**
 * Save / Merge multiple lessons into local offline cache
 */
export function saveLessonsLocally(lessons: Lesson[]): void {
  if (!Array.isArray(lessons)) return;
  const current = getStoredLessons();
  const map = new Map<string, Lesson>();

  // Add existing
  for (const l of current) {
    map.set(l.id, l);
  }

  // Overwrite or append fresh
  for (const l of lessons) {
    map.set(l.id, l);
  }

  const merged = Array.from(map.values());
  memLessonsCache = merged;
  safeSetStorage(LS_LESSONS_CACHE, merged);
  safeSetStorage(LS_LAST_SYNC, new Date().toISOString());

  // Dispatch custom event to notify listeners
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('aadir:lessons:updated', { detail: { count: merged.length } }));
  }
}

/**
 * Add or update single lesson in local cache
 */
export function addOrUpdateLocalLesson(lesson: Lesson): void {
  saveLessonsLocally([lesson]);
}

/**
 * Delete a lesson from local cache
 */
export function deleteStoredLesson(id: string): void {
  const current = getStoredLessons();
  const filtered = current.filter((l) => l.id !== id);
  memLessonsCache = filtered;
  safeSetStorage(LS_LESSONS_CACHE, filtered);

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('aadir:lessons:updated', { detail: { count: filtered.length } }));
  }
}

/**
 * Clear all cached lessons
 */
export function clearLessonStore(): void {
  memLessonsCache = [];
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(LS_LESSONS_CACHE);
      window.localStorage.removeItem(LS_LAST_SYNC);
      window.dispatchEvent(new CustomEvent('aadir:lessons:updated', { detail: { count: 0 } }));
    } catch {
      // ignore
    }
  }
}

/**
 * Synchronize lessons with server API (/api/lessons).
 * If offline or fetch fails, falls back to local cache safely without throwing.
 */
export async function syncLessonsWithServer(options?: {
  subject?: string;
  grade?: Grade | number;
}): Promise<{ lessons: Lesson[]; source: 'server' | 'cache'; isOffline: boolean }> {
  const queryParams = new URLSearchParams();
  if (options?.subject && options.subject !== 'all') {
    queryParams.append('subject', options.subject);
  }
  if (options?.grade) {
    queryParams.append('grade', String(options.grade));
  }

  const url = `/api/lessons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.lessons)) {
      saveLessonsLocally(data.lessons);
      return {
        lessons: getStoredLessons(options),
        source: 'server',
        isOffline: false,
      };
    }

    throw new Error('Invalid server response shape');
  } catch {
    // Network failure / offline: read from local cache
    const cached = getStoredLessons(options);
    return {
      lessons: cached,
      source: 'cache',
      isOffline: true,
    };
  }
}
