import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBibleStore } from '../store/bibleStore';
import { useTranslation } from '../hooks/useTranslation';
import { loadBible, loadExplanations, getBookName, getVerseKey, type BibleVersion } from '../services/bibleText';
import { BIBLE_BOOKS_ORDER, CHAPTER_COUNTS } from '../data/bibleSchedule';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2019;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

type VerseEntry = { bookId: string; chapter: number; verse: number; text: string; explanation?: string };

export default function BibleBookViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bookSectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { t } = useTranslation();
  const { bibleVersion, setBibleVersion, showExplanation, setShowExplanation } = useBibleStore();
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(false); // 모바일에서 내용 우선
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | null>(null);

  const version: BibleVersion = bibleVersion;

  useEffect(() => {
    Promise.all([loadBible(version), loadExplanations()]).then(([d, expl]) => {
      setData(d);
      setExplanations(expl);
      setLoading(false);
    });
  }, [version]);

  const verses = useMemo<VerseEntry[]>(() => {
    const out: VerseEntry[] = [];
    if (!data) return out;
    for (const book of BIBLE_BOOKS_ORDER) {
      const chapters = CHAPTER_COUNTS[book.id] ?? 0;
      for (let ch = 1; ch <= chapters; ch++) {
        for (let v = 1; v <= 200; v++) {
          const key = getVerseKey(book.id, ch, v);
          const raw = data[key];
          if (!raw) break;
          out.push({
            bookId: book.id,
            chapter: ch,
            verse: v,
            text: decodeHtmlEntities(raw.replace(/\s*!\s*$/, '')),
            explanation: explanations[key]?.trim() || undefined,
          });
        }
      }
    }
    return out;
  }, [data, explanations]);

  type FlatItem =
    | { type: 'book'; bookId: string; height: number }
    | { type: 'chapter'; bookId: string; chNum: number; height: number }
    | { type: 'verse'; bookId: string; chNum: number; verse: VerseEntry; key: string; height: number };

  const { flatItems, verseKeyToIndex, bookIdToIndex } = useMemo(() => {
    const items: FlatItem[] = [];
    const verseMap = new Map<string, number>();
    const bookMap = new Map<string, number>();
    const q = searchQuery.trim().toLowerCase();
    const isSearch = q.length > 0;

    for (const book of BIBLE_BOOKS_ORDER) {
      const bookVerses = verses.filter((v) => v.bookId === book.id);
      if (bookVerses.length === 0) continue;

      const chapters = new Map<number, VerseEntry[]>();
      for (const v of bookVerses) {
        const arr = chapters.get(v.chapter) ?? [];
        arr.push(v);
        chapters.set(v.chapter, arr);
      }
      const chEntries = [...chapters.entries()].sort((a, b) => a[0] - b[0]);

      if (!isSearch) {
        bookMap.set(book.id, items.length);
        items.push({ type: 'book', bookId: book.id, height: 56 });
      }

      for (const [chNum, chVerses] of chEntries) {
        const visibleVerses = isSearch ? chVerses.filter((v) => v.text.toLowerCase().includes(q)) : chVerses;
        if (visibleVerses.length === 0) continue;

        if (isSearch && !bookMap.has(book.id)) bookMap.set(book.id, items.length);
        items.push({ type: 'chapter', bookId: book.id, chNum, height: 36 });
        for (const v of visibleVerses) {
          const key = getVerseKey(v.bookId, v.chapter, v.verse);
          const h = showExplanation && v.explanation ? 78 : 52;
          verseMap.set(key, items.length);
          items.push({ type: 'verse', bookId: book.id, chNum, verse: v, key, height: h });
        }
      }
    }
    return { flatItems: items, verseKeyToIndex: verseMap, bookIdToIndex: bookMap };
  }, [verses, searchQuery, showExplanation]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => flatItems[i]?.height ?? 52,
    overscan: 12,
  });

  const runSearch = useCallback(() => {
    if (!searchQuery.trim() || !data) {
      setSearchResults([]);
      setCurrentMatchIndex(0);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    const keys: string[] = [];
    for (const book of BIBLE_BOOKS_ORDER) {
      const chapters = CHAPTER_COUNTS[book.id] ?? 0;
      for (let ch = 1; ch <= chapters; ch++) {
        for (let v = 1; v <= 200; v++) {
          const key = getVerseKey(book.id, ch, v);
          const raw = data[key];
          if (!raw) break;
          const text = decodeHtmlEntities(raw.replace(/\s*!\s*$/, '')).toLowerCase();
          if (text.includes(q)) keys.push(key);
        }
      }
    }
    setSearchResults(keys);
    setCurrentMatchIndex(keys.length > 0 ? 0 : -1);
  }, [searchQuery, data]);

  useEffect(() => {
    const timer = setTimeout(runSearch, 300);
    return () => clearTimeout(timer);
  }, [runSearch]);

  const scrollToVerse = useCallback((key: string) => {
    const idx = verseKeyToIndex.get(key);
    if (idx !== undefined) {
      setHighlightedVerseKey(key);
      setTimeout(() => setHighlightedVerseKey(''), 1500);
      rowVirtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    }
  }, [verseKeyToIndex, rowVirtualizer]);

  const goPrev = () => {
    if (searchResults.length === 0) return;
    const idx = currentMatchIndex <= 0 ? searchResults.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(idx);
    scrollToVerse(searchResults[idx]!);
  };

  const goNext = () => {
    if (searchResults.length === 0) return;
    const idx = currentMatchIndex >= searchResults.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(idx);
    scrollToVerse(searchResults[idx]!);
  };

  const scrollToBook = useCallback((bookId: string) => {
    const idx = bookIdToIndex.get(bookId);
    if (idx !== undefined) {
      rowVirtualizer.scrollToIndex(idx, { align: 'start', behavior: 'smooth' });
    }
  }, [bookIdToIndex, rowVirtualizer]);

  useEffect(() => {
    const book = searchParams.get('book');
    if (book && data && flatItems.length > 0) {
      const idx = bookIdToIndex.get(book);
      if (idx != null) {
        setTimeout(() => rowVirtualizer.scrollToIndex(idx, { align: 'start', behavior: 'smooth' }), 100);
      }
    }
  }, [searchParams.get('book'), data, flatItems.length, bookIdToIndex, rowVirtualizer]);

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    const q = query.trim();
    const parts = text.split(new RegExp(`(${escapeRegex(q)})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 rounded px-0.5">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-white">
        <p className="text-[#5B6475] text-sm">{t('bibleLoading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] pb-safe-bottom bg-white border-b border-[#E6EAF2]">
        <div className="flex items-center gap-1.5 xs:gap-2 min-390:gap-2.5 px-2 xs:px-3 min-390:px-4 py-2.5 min-375:py-3 min-428:py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 xs:p-2 -ml-0.5 xs:-ml-1 rounded-lg hover:bg-gray-100 touch-target shrink-0"
            aria-label={t('back')}
          >
            ←
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-1.5 xs:p-2 rounded-lg hover:bg-gray-100 touch-target shrink-0 text-[#5B6475] text-sm"
            aria-label={t('home')}
          >
            🏠
          </button>
          <h1 className="flex-1 min-w-0 text-sm xs:text-base min-390:text-lg sm:text-xl font-bold text-[#1B64F2] truncate">
            {t('bibleBookTitle')}
          </h1>
          <div className="flex items-center gap-1 xs:gap-1.5 min-390:gap-2 shrink-0">
            <div className="flex rounded-lg overflow-hidden border border-[#E6EAF2]">
              <button
                onClick={() => setBibleVersion('ko')}
                className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 min-390:px-3 sm:px-3.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9] active:bg-[#E6EAF2]'}`}
                title={t('korean')}
              >
                <span className="sm:hidden">한</span>
                <span className="hidden sm:inline">{t('korean')}</span>
              </button>
              <button
                onClick={() => setBibleVersion('en')}
                className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 min-390:px-3 sm:px-3.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9] active:bg-[#E6EAF2]'}`}
                title={t('english')}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">{t('english')}</span>
              </button>
            </div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 min-390:px-3 py-1.5 text-[11px] xs:text-xs font-medium rounded-lg border border-[#E6EAF2] ${showExplanation ? 'bg-[#1B64F2] text-white border-[#1B64F2]' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9] active:bg-[#E6EAF2]'}`}
              title={t('bibleShowTranslation')}
            >
              {t('bibleTranslationToggle')}
            </button>
          </div>
        </div>

        <div className="px-2 xs:px-3 min-390:px-4 pb-2 min-375:pb-3">
          <div className="relative flex items-center gap-1.5 xs:gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t('bibleSearchPlaceholder')}
              className="flex-1 min-w-0 h-10 xs:h-11 min-390:h-[46px] pl-2.5 xs:pl-3 pr-3 xs:pr-4 py-2 rounded-lg xs:rounded-xl border border-[#E6EAF2] text-[13px] xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B64F2] focus:border-transparent"
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-0.5 xs:gap-1 shrink-0">
                <span className="text-[11px] xs:text-xs text-[#5B6475] whitespace-nowrap">
                  {currentMatchIndex + 1}/{searchResults.length}
                </span>
                <button
                  onClick={goPrev}
                  className="w-8 h-8 xs:w-9 xs:h-9 min-390:w-10 min-390:h-10 flex items-center justify-center rounded-lg bg-[#EEF4FF] text-[#1B64F2] hover:bg-[#E6EAF2] active:opacity-80 font-medium touch-target shrink-0"
                  aria-label="이전"
                >
                  ▲
                </button>
                <button
                  onClick={goNext}
                  className="w-8 h-8 xs:w-9 xs:h-9 min-390:w-10 min-390:h-10 flex items-center justify-center rounded-lg bg-[#EEF4FF] text-[#1B64F2] hover:bg-[#E6EAF2] active:opacity-80 font-medium touch-target shrink-0"
                  aria-label="다음"
                >
                  ▼
                </button>
              </div>
            )}
          </div>
          {/* 검색창 아래 목차 - 전서 클릭 시 해당 책으로 스크롤 */}
          <div className="overflow-x-auto overflow-y-hidden -mx-2 xs:-mx-3 min-390:-mx-4 px-2 xs:px-3 min-390:px-4 flex gap-1 xs:gap-1.5 min-390:gap-2 py-1.5 min-375:py-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {BIBLE_BOOKS_ORDER.map((book) => (
              <button
                key={book.id}
                onClick={() => scrollToBook(book.id)}
                className="shrink-0 px-2 xs:px-2.5 min-390:px-3 py-1 xs:py-1.5 rounded-lg text-[11px] xs:text-xs font-medium text-[#5B6475] bg-[#F1F5F9] hover:bg-[#EEF4FF] hover:text-[#1B64F2] active:bg-[#E6EAF2] whitespace-nowrap touch-target"
              >
                {getBookName(book.id, version)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${tocOpen ? 'w-[130px] xs:w-36 min-375:w-40 min-390:w-44 sm:w-52' : 'w-0'} shrink-0 flex flex-col border-r border-[#E6EAF2] overflow-y-auto transition-all duration-200 bg-[#FAFBFC]`}
        >
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="sticky top-0 px-2 xs:px-3 py-1.5 min-375:py-2 text-left text-xs xs:text-sm font-medium text-[#1B64F2] bg-white border-b border-[#E6EAF2] z-10 touch-target"
          >
            {tocOpen ? t('bibleTocClose') : t('bibleTocOpen')}
          </button>
          {tocOpen && (
            <nav className="p-1.5 xs:p-2 space-y-0.5">
              {BIBLE_BOOKS_ORDER.map((book) => (
                <button
                  key={book.id}
                  onClick={() => scrollToBook(book.id)}
                  className="w-full text-left px-2 xs:px-3 py-1.5 min-375:py-2 rounded-lg text-[12px] xs:text-sm text-[#0B1220] hover:bg-[#EEF4FF] active:bg-[#E6EAF2] touch-target"
                >
                  {getBookName(book.id, version)}
                </button>
              ))}
            </nav>
          )}
        </aside>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-2 xs:px-3 min-375:px-4 min-428:px-5 sm:px-6 py-3 xs:py-4 min-390:py-5 sm:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] min-390:pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div
            className="max-w-2xl mx-auto"
            style={{
              height: `${rowVirtualizer.getTotalSize() + 24}px`,
              position: 'relative',
              width: '100%',
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatItems[virtualRow.index];
              if (!item) return null;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 w-full px-0"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {item.type === 'book' && (
                    <h2
                      id={`book-${item.bookId}`}
                      ref={(el) => { if (el) bookSectionRefs.current.set(item.bookId, el); }}
                      className="scroll-mt-20 text-base xs:text-lg min-390:text-xl sm:text-2xl font-bold text-[#1B64F2] mb-3 xs:mb-4 pb-2 border-b border-[#E6EAF2]"
                    >
                      {getBookName(item.bookId, version)}
                    </h2>
                  )}
                  {item.type === 'chapter' && (
                    <h3 className="text-xs xs:text-sm font-semibold text-[#5B6475] mb-1.5 xs:mb-2">
                      {item.chNum}{t('bibleChapter')}
                    </h3>
                  )}
                  {item.type === 'verse' && (
                    <div
                      ref={(el) => { if (el) verseRefs.current.set(item.key, el); }}
                      data-verse-key={item.key}
                      className={`flex flex-col gap-0.5 py-0.5 rounded transition-colors mb-1.5 ${highlightedVerseKey === item.key ? 'ring-2 ring-[#1B64F2] bg-blue-50' : ''}`}
                    >
                      {/* 한국어 모드: 한국어(메인) 먼저, 영어(보조) 나중 | 영어 모드: 영어(메인) 먼저, 한국어(보조) 나중 */}
                      <div className="flex gap-1.5 xs:gap-2 min-390:gap-2">
                        <span className="shrink-0 text-[11px] xs:text-xs text-[#94a3b8] w-6 xs:w-7 min-390:w-8 sm:w-10">
                          {item.verse.verse}
                        </span>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          {version === 'ko' ? (
                            <>
                              <span className={`text-[13px] xs:text-sm min-390:text-base leading-relaxed font-semibold text-[#0B1220]`}>
                                {searchQuery.trim()
                                  ? highlightText(item.verse.explanation ?? '', searchQuery)
                                  : item.verse.explanation ?? item.verse.text}
                              </span>
                              {showExplanation && item.verse.explanation && item.verse.text && (
                                <div className="pl-2 border-l-2 border-[#E6EAF2] font-normal text-[#5B6475]">
                                  <span className="text-[11px] xs:text-xs text-[#94a3b8] font-medium">{t('englishKJVLabel')}</span>{' '}
                                  <span className="text-[12px] xs:text-sm">
                                    {searchQuery.trim()
                                      ? highlightText(item.verse.text, searchQuery)
                                      : item.verse.text}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <span className={`text-[13px] xs:text-sm min-390:text-base leading-relaxed font-semibold text-[#0B1220]`}>
                                {searchQuery.trim()
                                  ? highlightText(item.verse.text, searchQuery)
                                  : item.verse.text}
                              </span>
                              {showExplanation && item.verse.explanation && (
                                <div className="pl-2 border-l-2 border-[#E6EAF2] font-normal text-[#5B6475]">
                                  <span className="text-[11px] xs:text-xs text-[#94a3b8] font-medium">{t('explanationLabel')}</span>{' '}
                                  <span className="text-[12px] xs:text-sm">{item.verse.explanation}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
