/**
 * 성경 책별 캐시 - 최소 의존성 (preload용)
 */

export type BibleData = Record<string, string>;

export const bookCache: Record<string, BibleData> = {};

export async function loadBook(bookId: string): Promise<BibleData> {
  if (bookCache[bookId]) return bookCache[bookId];
  const res = await fetch(`/bible/books/${bookId}.json`);
  if (!res.ok) throw new Error(`Failed to load ${bookId}`);
  const data = (await res.json()) as BibleData;
  bookCache[bookId] = data;
  return data;
}

export function preloadBook(bookId: string): void {
  if (!bookCache[bookId]) loadBook(bookId).catch(() => {});
}
