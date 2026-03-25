import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getReadingPlanKey, type ReadingItem } from '../data/bibleSchedule';
import type { BibleVersion } from '../services/bibleText';

export type { BibleVersion };

export interface BibleMemo {
  id: string;
  dayIndex: number;
  readingRef: string;
  date: string;
  question1: string;
  question2: string;
  memo1: string;
  memo2: string;
  dailyNote: string;
  createdAt: number;
  /** getReadingPlanKey — 전서 변경 시 동일 일차와 구분 */
  planKey?: string;
}

export interface BibleBookmark {
  id: string;
  dayIndex: number;
  readingRef: string;
  date: string;
  createdAt: number;
  planKey?: string;
}

export interface BibleDailyVerse {
  id: string;
  date: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  explanation?: string;
  createdAt: number;
}

export interface CompletedDay {
  dayIndex: number;
  date: string;
  createdAt: number;
  /** getReadingPlanKey — 전서·순서가 바뀌면 같은 일차도 다른 읽기 단위 */
  planKey?: string;
}

const genId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useBibleStore = create<{
  startBookId: string;
  customOrder: string[] | null;
  currentDayIndex: number;
  bibleVersion: BibleVersion;
  showExplanation: boolean;
  bookmarks: BibleBookmark[];
  memos: BibleMemo[];
  dailyVerses: BibleDailyVerse[];
  completedDays: CompletedDay[];
  setStartBook: (bookId: string) => void;
  toggleDayComplete: (dayIndex: number, date: string) => void;
  isDayComplete: (dayIndex: number) => boolean;
  resetReadPlan: () => void;
  setBibleVersion: (v: BibleVersion) => void;
  setShowExplanation: (v: boolean) => void;
  setCustomOrder: (order: string[] | null) => void;
  setCurrentDay: (day: number) => void;
  addBookmark: (item: ReadingItem, date: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (dayIndex: number, date: string) => boolean;
  saveMemo: (memo: Omit<BibleMemo, 'id' | 'createdAt'>) => void;
  updateMemo: (id: string, updates: Partial<BibleMemo>) => void;
  deleteMemo: (id: string) => void;
  addDailyVerse: (verse: { bookName: string; chapter: number; verse: number; text: string; explanation?: string }, date: string) => void;
  removeDailyVerse: (id: string) => void;
  getMemosByDate: () => { date: string; items: (BibleMemo | BibleBookmark)[] }[];
  getDailyVersesByDate: () => { date: string; items: BibleDailyVerse[] }[];
  searchMemos: (query: string) => (BibleMemo | BibleBookmark)[];
  searchDailyVerses: (query: string) => BibleDailyVerse[];
}>()(
  persist(
    (set, get) => ({
      startBookId: 'genesis',
      customOrder: null,
      currentDayIndex: 1,
      bibleVersion: 'ko',
      showExplanation: true,
      bookmarks: [],
      memos: [],
      dailyVerses: [],
      completedDays: [],
      setStartBook: (bookId) => set({ startBookId: bookId }),
      toggleDayComplete: (dayIndex, date) => {
        const { completedDays, startBookId, customOrder } = get();
        const planKey = getReadingPlanKey(startBookId, customOrder);
        const match = (c: CompletedDay) =>
          c.dayIndex === dayIndex && (c.planKey ?? 'genesis') === planKey;
        const existing = completedDays.find(match);
        if (existing) {
          set({ completedDays: completedDays.filter((c) => !match(c)) });
        } else {
          set({
            completedDays: [
              ...completedDays,
              { dayIndex, date, createdAt: Date.now(), planKey },
            ],
          });
        }
      },
      isDayComplete: (dayIndex) => {
        const { completedDays, startBookId, customOrder } = get();
        const planKey = getReadingPlanKey(startBookId, customOrder);
        return completedDays.some(
          (c) => c.dayIndex === dayIndex && (c.planKey ?? 'genesis') === planKey
        );
      },
      resetReadPlan: () => set({ completedDays: [], currentDayIndex: 1 }),
      setCustomOrder: (order) => set({ customOrder: order }),
      setBibleVersion: (v) => set({ bibleVersion: v }),
      setShowExplanation: (v) => set({ showExplanation: v }),
      setCurrentDay: (day) => set({ currentDayIndex: Math.max(1, day) }),
      addBookmark: (item, date) => {
        const { bookmarks, startBookId, customOrder } = get();
        const planKey = getReadingPlanKey(startBookId, customOrder);
        if (
          bookmarks.some(
            (b) =>
              b.dayIndex === item.dayIndex &&
              b.date === date &&
              (b.planKey ?? 'genesis') === planKey
          )
        ) {
          return;
        }
        set({
          bookmarks: [
            ...bookmarks,
            {
              id: genId(),
              dayIndex: item.dayIndex,
              readingRef: `${item.book} ${item.startCh}${item.endCh !== item.startCh ? `-${item.endCh}` : ''}장`,
              date,
              createdAt: Date.now(),
              planKey,
            },
          ],
        });
      },
      removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
      isBookmarked: (dayIndex, date) => {
        const { bookmarks, startBookId, customOrder } = get();
        const planKey = getReadingPlanKey(startBookId, customOrder);
        return bookmarks.some(
          (b) =>
            b.dayIndex === dayIndex &&
            b.date === date &&
            (b.planKey ?? 'genesis') === planKey
        );
      },
      saveMemo: (memo) => {
        const { startBookId, customOrder } = get();
        const pk = memo.planKey ?? getReadingPlanKey(startBookId, customOrder);
        set((s) => ({
          memos: [...s.memos, { ...memo, planKey: pk, id: genId(), createdAt: Date.now() }],
        }));
      },
      updateMemo: (id, updates) =>
        set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
      deleteMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),
      addDailyVerse: (verse, date) =>
        set((s) => ({
          dailyVerses: [
            ...s.dailyVerses,
            { ...verse, id: genId(), date, createdAt: Date.now() },
          ],
        })),
      removeDailyVerse: (id) => set((s) => ({ dailyVerses: s.dailyVerses.filter((v) => v.id !== id) })),
      getMemosByDate: () => {
        const { memos, bookmarks } = get();
        const map = new Map<string, (BibleMemo | BibleBookmark)[]>();
        const add = (date: string, item: BibleMemo | BibleBookmark) => {
          if (!map.has(date)) map.set(date, []);
          map.get(date)!.push(item);
        };
        memos.forEach((m) => add(m.date, m));
        bookmarks.forEach((b) => add(b.date, b));
        return Array.from(map.entries())
          .sort(([a], [b]) => (b as string).localeCompare(a as string))
          .map(([date, items]) => ({
            date,
            items: items.sort((x, y) => {
              const t1 = 'createdAt' in x ? x.createdAt : 0;
              const t2 = 'createdAt' in y ? y.createdAt : 0;
              return t2 - t1;
            }),
          }));
      },
      getDailyVersesByDate: () => {
        const { dailyVerses } = get();
        const map = new Map<string, BibleDailyVerse[]>();
        dailyVerses.forEach((v) => {
          if (!map.has(v.date)) map.set(v.date, []);
          map.get(v.date)!.push(v);
        });
        return Array.from(map.entries())
          .sort(([a], [b]) => (b as string).localeCompare(a as string))
          .map(([date, items]) => ({
            date,
            items: items.sort((a, b) => b.createdAt - a.createdAt),
          }));
      },
      searchMemos: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const { memos, bookmarks } = get();
        const matches: (BibleMemo | BibleBookmark)[] = [];
        const check = (text: string) => text.toLowerCase().includes(q);
        memos.forEach((m) => {
          if (check(m.readingRef) || check(m.memo1) || check(m.memo2) || check(m.dailyNote) || check(m.question1) || check(m.question2)) {
            matches.push(m);
          }
        });
        bookmarks.forEach((b) => { if (check(b.readingRef)) matches.push(b); });
        return matches.sort((a, b) => {
          const t1 = 'createdAt' in a ? a.createdAt : 0;
          const t2 = 'createdAt' in b ? b.createdAt : 0;
          return t2 - t1;
        });
      },
      searchDailyVerses: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const { dailyVerses } = get();
        const check = (text: string) => text.toLowerCase().includes(q);
        return dailyVerses.filter(
          (v) =>
            check(v.text) ||
            (v.explanation && check(v.explanation)) ||
            check(v.bookName) ||
            check(`${v.bookName} ${v.chapter}:${v.verse}`) ||
            check(v.date)
        ).sort((a, b) => b.createdAt - a.createdAt);
      },
    }),
    {
      name: 'bible-daily-storage',
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined;
        const merged = { ...current, ...p };
        if (merged.bibleVersion !== 'ko' && merged.bibleVersion !== 'en') {
          merged.bibleVersion = 'ko';
        }
        const raw = merged.completedDays as CompletedDay[] | undefined;
        if (Array.isArray(raw)) {
          merged.completedDays = raw.map((c) => ({
            ...c,
            planKey: c.planKey ?? 'genesis',
          }));
        }
        const rawMemos = merged.memos as BibleMemo[] | undefined;
        if (Array.isArray(rawMemos)) {
          merged.memos = rawMemos.map((m) => ({
            ...m,
            planKey: m.planKey ?? 'genesis',
          }));
        }
        const rawBm = merged.bookmarks as BibleBookmark[] | undefined;
        if (Array.isArray(rawBm)) {
          merged.bookmarks = rawBm.map((b) => ({
            ...b,
            planKey: b.planKey ?? 'genesis',
          }));
        }
        return merged;
      },
    }
  )
);
