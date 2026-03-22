/**
 * 성경 본문 로드
 * - KJV(King James Version, public domain) only
 * - 책별 분할 로딩으로 1일1독 페이지 속도 개선
 * - 한국어 설명: 동적 로드로 초기 번들 축소
 */

import { loadBook as loadBookFromCache, bookCache } from './bibleCache';

type BibleData = Record<string, string>;

const BOOK_IDS = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
  '1samuel', '2samuel', '1kings', '2kings', '1chronicles', '2chronicles', 'ezra', 'nehemiah',
  'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'song', 'isaiah', 'jeremiah',
  'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
  'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'matthew', 'mark',
  'luke', 'john', 'acts', 'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians',
  'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy', '2timothy',
  'titus', 'philemon', 'hebrews', 'james', '1peter', '2peter', '1john', '2john', '3john',
  'jude', 'revelation',
] as const;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#x39;/g, "'")
    .replace(/&#x2019;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export type BibleVersion = 'ko' | 'en';

const cache: { kjv?: BibleData } = {};

/** 특정 책만 로드 (1일1독용, ~200KB vs 4.7MB) */
export async function loadBook(bookId: string): Promise<BibleData> {
  return loadBookFromCache(bookId);
}

/** KJV 전체 (성경책 보기, 말씀 뽑기용) - 책별 병렬 로드 */
export async function loadBible(_version?: BibleVersion): Promise<BibleData> {
  if (cache.kjv) return cache.kjv;
  await Promise.all(BOOK_IDS.map((id) => loadBookFromCache(id)));
  const merged: BibleData = {};
  for (const id of BOOK_IDS) Object.assign(merged, bookCache[id] || {});
  cache.kjv = merged;
  return cache.kjv;
}

/** 점진적 로드: 먼저 첫 배치로 빠르게 표시, 나머지는 백그라운드 로드 */
const INITIAL_BATCH = 5;
export async function loadBibleProgressive(
  onPartial: (data: BibleData) => void
): Promise<BibleData> {
  if (cache.kjv) {
    onPartial(cache.kjv);
    return cache.kjv;
  }
  const merged: BibleData = {};
  const firstBatch = BOOK_IDS.slice(0, INITIAL_BATCH);
  await Promise.all(firstBatch.map((id) => loadBookFromCache(id)));
  for (const id of firstBatch) Object.assign(merged, bookCache[id] || {});
  onPartial({ ...merged });
  // 나머지 책들을 10권씩 순차 로드해 UI 블로킹 최소화
  const rest = BOOK_IDS.slice(INITIAL_BATCH);
  const CHUNK = 10;
  for (let i = 0; i < rest.length; i += CHUNK) {
    const chunk = rest.slice(i, i + CHUNK);
    await Promise.all(chunk.map((id) => loadBookFromCache(id)));
    for (const id of chunk) Object.assign(merged, bookCache[id] || {});
    onPartial({ ...merged });
  }
  cache.kjv = merged;
  return merged;
}

let explanationsCache: BibleData | null = null;
/** 한국어 설명 (본문과 별도) - 필요 시에만 동적 로드해 초기 로딩 속도 개선 */
export async function loadExplanations(): Promise<BibleData> {
  if (explanationsCache) return explanationsCache;
  const mod = await import('../data/explanations.json');
  explanationsCache = mod.default as BibleData;
  return explanationsCache;
}

export function getVerseKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId},${chapter},${verse}`;
}

export async function getVerses(
  bookId: string,
  startCh: number,
  endCh: number,
  _version: BibleVersion = 'ko'
): Promise<{ chapter: number; verse: number; text: string; explanation?: string }[]> {
  const data = await loadBook(bookId);
  const explanations = await loadExplanations();
  const result: { chapter: number; verse: number; text: string; explanation?: string }[] = [];
  for (let ch = startCh; ch <= endCh; ch++) {
    for (let v = 1; v <= 200; v++) {
      const key = getVerseKey(bookId, ch, v);
      const text = data[key];
      if (!text) break;
      result.push({
        chapter: ch,
        verse: v,
        text: decodeHtmlEntities(text.replace(/\s*!\s*$/, '')),
        explanation: explanations[key]?.trim() || undefined,
      });
    }
  }
  return result;
}

const BOOK_NAMES_KO: Record<string, string> = {
  genesis: '창세기', exodus: '출애굽기', leviticus: '레위기', numbers: '민수기',
  deuteronomy: '신명기', joshua: '여호수아', judges: '사사기', ruth: '룻기',
  '1samuel': '사무엘상', '2samuel': '사무엘하', '1kings': '열왕기상', '2kings': '열왕기하',
  '1chronicles': '역대상', '2chronicles': '역대하', ezra: '에스라', nehemiah: '느헤미야',
  esther: '에스더', job: '욥기', psalms: '시편', proverbs: '잠언', ecclesiastes: '전도서', song: '아가',
  isaiah: '이사야', jeremiah: '예레미야', lamentations: '예레미야애가', ezekiel: '에스겔', daniel: '다니엘',
  hosea: '호세아', joel: '요엘', amos: '아모스', obadiah: '오바댜', jonah: '요나', micah: '미가',
  nahum: '나훔', habakkuk: '하박국', zephaniah: '스바냐', haggai: '학개', zechariah: '스가랴', malachi: '말라기',
  matthew: '마태복음', mark: '마가복음', luke: '누가복음', john: '요한복음', acts: '사도행전',
  romans: '로마서', '1corinthians': '고린도전서', '2corinthians': '고린도후서', galatians: '갈라디아서',
  ephesians: '에베소서', philippians: '빌립보서', colossians: '골로새서',
  '1thessalonians': '데살로니가전서', '2thessalonians': '데살로니가후서',
  '1timothy': '디모데전서', '2timothy': '디모데후서', titus: '디도서', philemon: '빌레몬서',
  hebrews: '히브리서', james: '야고보서', '1peter': '베드로전서', '2peter': '베드로후서',
  '1john': '요한일서', '2john': '요한이서', '3john': '요한삼서', jude: '유다서', revelation: '요한계시록',
};

const BOOK_NAMES_EN: Record<string, string> = {
  genesis: 'Genesis', exodus: 'Exodus', leviticus: 'Leviticus', numbers: 'Numbers',
  deuteronomy: 'Deuteronomy', joshua: 'Joshua', judges: 'Judges', ruth: 'Ruth',
  '1samuel': '1 Samuel', '2samuel': '2 Samuel', '1kings': '1 Kings', '2kings': '2 Kings',
  '1chronicles': '1 Chronicles', '2chronicles': '2 Chronicles', ezra: 'Ezra', nehemiah: 'Nehemiah',
  esther: 'Esther', job: 'Job', psalms: 'Psalms', proverbs: 'Proverbs', ecclesiastes: 'Ecclesiastes', song: 'Song of Solomon',
  isaiah: 'Isaiah', jeremiah: 'Jeremiah', lamentations: 'Lamentations', ezekiel: 'Ezekiel', daniel: 'Daniel',
  hosea: 'Hosea', joel: 'Joel', amos: 'Amos', obadiah: 'Obadiah', jonah: 'Jonah', micah: 'Micah',
  nahum: 'Nahum', habakkuk: 'Habakkuk', zephaniah: 'Zephaniah', haggai: 'Haggai', zechariah: 'Zechariah', malachi: 'Malachi',
  matthew: 'Matthew', mark: 'Mark', luke: 'Luke', john: 'John', acts: 'Acts',
  romans: 'Romans', '1corinthians': '1 Corinthians', '2corinthians': '2 Corinthians', galatians: 'Galatians',
  ephesians: 'Ephesians', philippians: 'Philippians', colossians: 'Colossians',
  '1thessalonians': '1 Thessalonians', '2thessalonians': '2 Thessalonians',
  '1timothy': '1 Timothy', '2timothy': '2 Timothy', titus: 'Titus', philemon: 'Philemon',
  hebrews: 'Hebrews', james: 'James', '1peter': '1 Peter', '2peter': '2 Peter',
  '1john': '1 John', '2john': '2 John', '3john': '3 John', jude: 'Jude', revelation: 'Revelation',
};

export function getBookName(bookId: string, version: BibleVersion): string {
  const map = version === 'ko' ? BOOK_NAMES_KO : BOOK_NAMES_EN;
  return map[bookId] || bookId;
}

export async function getRandomVerse(version: BibleVersion = 'ko'): Promise<{
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  explanation?: string;
}> {
  const data = await loadBible();
  const explanations = await loadExplanations();
  // 직역이 있는 구절만 뽑아서 말씀 읽기에서 항상 한국어 직역이 보이게 함
  const keysWithTranslation = Object.keys(explanations).filter(
    (k) => explanations[k]?.trim() && data[k]
  );
  const keys = keysWithTranslation.length > 0 ? keysWithTranslation : Object.keys(data);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const [bookId, chStr, vStr] = key.split(',');
  const chapter = parseInt(chStr, 10);
  const verse = parseInt(vStr, 10);
  const text = decodeHtmlEntities((data[key] || '').replace(/\s*!\s*$/, ''));
  const bookName = getBookName(bookId, version);
  const explanation = explanations[key]?.trim();

  return { bookId, bookName, chapter, verse, text, explanation };
}
