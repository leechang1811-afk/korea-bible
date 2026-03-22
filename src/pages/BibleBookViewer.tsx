import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue, useTransition, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBibleStore } from '../store/bibleStore';
import { useTranslation } from '../hooks/useTranslation';
import { loadBook, loadExplanations, getBookName, getVerseKey, type BibleVersion } from '../services/bibleText';
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

type FlatItem =
  | { type: 'chapter'; bookId: string; chNum: number; height: number }
  | { type: 'verse'; bookId: string; chNum: number; verse: VerseEntry; key: string; height: number };

const VirtualRow = memo(function VirtualRow(props: {
  item: FlatItem;
  virtualIndex: number;
  virtualStart: number;
  version: 'ko' | 'en';
  searchQuery: string;
  showExplanation: boolean;
  highlightedVerseKey: string | null;
  measureRef: (el: Element | null) => void;
  setVerseRef: (key: string, el: HTMLDivElement | null) => void;
  getBookName: (id: string, v: 'ko' | 'en') => string;
  t: (k: string) => string;
  highlightText: (text: string, q: string) => React.ReactNode;
}) {
  const { item, virtualIndex, virtualStart, version, searchQuery, showExplanation, highlightedVerseKey, measureRef, setVerseRef, getBookName, t, highlightText } = props;
  return (
    <div data-index={virtualIndex} ref={measureRef} className="absolute left-0 w-full px-0" style={{ transform: `translateY(${virtualStart}px)` }}>
      {item.type === 'chapter' && (
        <h3 className="text-xs xs:text-sm font-semibold text-[#5B6475] mb-1.5 xs:mb-2">{item.chNum}{t('bibleChapter')}</h3>
      )}
      {item.type === 'verse' && (
        <div ref={(el) => setVerseRef(item.key, el)} data-verse-key={item.key} className={`flex flex-col gap-0.5 py-0.5 rounded transition-colors mb-1.5 ${highlightedVerseKey === item.key ? 'ring-2 ring-[#1B64F2] bg-blue-50' : ''}`}>
          <div className="flex gap-1.5 xs:gap-2 min-390:gap-2">
            <span className="shrink-0 text-[11px] xs:text-xs text-[#94a3b8] w-6 xs:w-7 min-390:w-8 sm:w-10">{item.verse.verse}</span>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {version === 'ko' ? (
                <>
                  <span className="text-[13px] xs:text-sm min-390:text-base leading-relaxed font-semibold text-[#0B1220]">
                    {searchQuery.trim() ? highlightText(item.verse.explanation ?? '', searchQuery) : item.verse.explanation ?? item.verse.text}
                  </span>
                  {showExplanation && item.verse.explanation && item.verse.text && (
                    <div className="pl-2 border-l-2 border-[#E6EAF2] font-normal text-[#5B6475]">
                      <span className="text-[11px] xs:text-xs text-[#94a3b8] font-medium">{t('englishKJVLabel')}</span>{' '}
                      <span className="text-[12px] xs:text-sm">{searchQuery.trim() ? highlightText(item.verse.text, searchQuery) : item.verse.text}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[13px] xs:text-sm min-390:text-base leading-relaxed font-semibold text-[#0B1220]">
                    {searchQuery.trim() ? highlightText(item.verse.text, searchQuery) : item.verse.text}
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
});

export default function BibleBookViewer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { t } = useTranslation();
  const { bibleVersion, setBibleVersion, showExplanation, setShowExplanation } = useBibleStore();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(() => searchParams.get('book') || null);
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const version: BibleVersion = bibleVersion;
  const bookIds = BIBLE_BOOKS_ORDER.map((b) => b.id);

  // URL ?book= 파라미터와 상태 동기화 (뒤로가기, 딥링크 등)
  useEffect(() => {
    const bookFromUrl = searchParams.get('book');
    if (bookFromUrl && bookIds.includes(bookFromUrl)) {
      if (selectedBookId !== bookFromUrl) setSelectedBookId(bookFromUrl);
    } else if (!bookFromUrl && selectedBookId) {
      setSelectedBookId(null);
      setData(null);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    loadExplanations().then((expl) => {
      if (cancelled) return;
      setExplanations(expl);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedBookId) return;
    let cancelled = false;
    setLoading(true);
    loadBook(selectedBookId).then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedBookId]);

  const { flatItems, verseKeyToIndex } = useMemo(() => {
    const items: FlatItem[] = [];
    const verseMap = new Map<string, number>();
    if (!data || !selectedBookId) return { flatItems: items, verseKeyToIndex: verseMap };

    const q = deferredSearchQuery.trim().toLowerCase();
    const isSearch = q.length > 0;
    const searchKo = version === 'ko';
    const chapters = CHAPTER_COUNTS[selectedBookId] ?? 0;

    for (let ch = 1; ch <= chapters; ch++) {
      const chVerses: VerseEntry[] = [];
      for (let v = 1; v <= 200; v++) {
        const key = getVerseKey(selectedBookId, ch, v);
        const raw = data[key];
        if (!raw) break;
        const text = decodeHtmlEntities(raw.replace(/\s*!\s*$/, ''));
        const explanation = explanations[key]?.trim() || undefined;
        const match = !isSearch || (searchKo ? text.toLowerCase().includes(q) || (explanation?.toLowerCase().includes(q) ?? false) : text.toLowerCase().includes(q));
        if (match) chVerses.push({ bookId: selectedBookId, chapter: ch, verse: v, text, explanation });
      }
      if (chVerses.length === 0) continue;

      items.push({ type: 'chapter', bookId: selectedBookId, chNum: ch, height: 36 });
      for (const verse of chVerses) {
        const key = getVerseKey(verse.bookId, verse.chapter, verse.verse);
        const h = showExplanation && verse.explanation ? 78 : 52;
        verseMap.set(key, items.length);
        items.push({ type: 'verse', bookId: selectedBookId, chNum: ch, verse, key, height: h });
      }
    }
    return { flatItems: items, verseKeyToIndex: verseMap };
  }, [data, explanations, selectedBookId, deferredSearchQuery, showExplanation, version]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => flatItems[i]?.height ?? 52,
    overscan: 20,
  });

  const runSearch = useCallback(() => {
    if (!deferredSearchQuery.trim() || !data || !selectedBookId) {
      startTransition(() => {
        setSearchResults([]);
        setCurrentMatchIndex(0);
      });
      return;
    }
    const q = deferredSearchQuery.trim().toLowerCase();
    const keys: string[] = [];
    const searchKorean = version === 'ko';
    const chapters = CHAPTER_COUNTS[selectedBookId] ?? 0;
    for (let ch = 1; ch <= chapters; ch++) {
      for (let v = 1; v <= 200; v++) {
        const key = getVerseKey(selectedBookId, ch, v);
        const raw = data[key];
        if (!raw) break;
        const textEn = decodeHtmlEntities(raw.replace(/\s*!\s*$/, '')).toLowerCase();
        const textKo = (explanations[key] ?? '').trim().toLowerCase();
        const match = textEn.includes(q) || (searchKorean && textKo.includes(q));
        if (match) keys.push(key);
      }
    }
    startTransition(() => {
      setSearchResults(keys);
      setCurrentMatchIndex(keys.length > 0 ? 0 : -1);
    });
  }, [deferredSearchQuery, data, explanations, selectedBookId, version]);

  useEffect(() => {
    const timer = setTimeout(runSearch, 400);
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

  const selectBook = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
    setSearchParams({ book: bookId });
    setSearchQuery('');
    setSearchResults([]);
  }, [setSearchParams]);

  const goToPicker = useCallback(() => {
    setSelectedBookId(null);
    setSearchParams({});
    setData(null);
    setSearchQuery('');
  }, [setSearchParams]);

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  const highlightText = useCallback((text: string, query: string): React.ReactNode => {
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
  }, []);

  // 1. 전서 선택 화면
  if (!selectedBookId) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
        <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] pb-safe-bottom bg-white border-b border-[#E6EAF2]">
          <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 min-390:px-4 py-2.5 min-375:py-3">
            <button onClick={() => navigate(-1)} className="p-1.5 xs:p-2 -ml-0.5 rounded-lg hover:bg-gray-100 touch-target" aria-label={t('back')}>←</button>
            <button onClick={() => navigate('/')} className="p-1.5 xs:p-2 rounded-lg hover:bg-gray-100 touch-target" aria-label={t('navHome')}>🏠</button>
            <h1 className="flex-1 min-w-0 text-sm xs:text-base min-390:text-lg font-bold text-[#1B64F2] truncate">{t('bibleSelectBook')}</h1>
            <div className="flex rounded-lg overflow-hidden border border-[#E6EAF2] shrink-0">
              <button onClick={() => setBibleVersion('ko')} className={`min-h-[40px] px-2.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}>{t('korean')}</button>
              <button onClick={() => setBibleVersion('en')} className={`min-h-[40px] px-2.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}>{t('english')}</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-2 xs:px-3 min-390:px-4 py-4 sm:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto grid grid-cols-2 xs:grid-cols-3 min-390:grid-cols-4 gap-2 xs:gap-2.5">
            {BIBLE_BOOKS_ORDER.map((book) => (
              <button
                key={book.id}
                onClick={() => selectBook(book.id)}
                className="min-h-[48px] xs:min-h-[52px] px-3 py-2.5 rounded-xl text-left text-[13px] xs:text-sm font-medium text-[#0B1220] bg-[#F8FAFC] hover:bg-[#EEF4FF] active:bg-[#E6EAF2] border border-[#E6EAF2] touch-target"
              >
                {getBookName(book.id, version)}
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // 2. 책 내용 화면 (로딩 중)
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-white">
        <p className="text-[#5B6475] text-sm">{t('bibleLoading')}</p>
      </div>
    );
  }

  // 3. 책 내용 + 검색
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] pb-safe-bottom bg-white border-b border-[#E6EAF2]">
        <div className="flex items-center gap-1.5 xs:gap-2 min-390:gap-2.5 px-2 xs:px-3 min-390:px-4 py-2.5 min-375:py-3">
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => navigate(-1)} className="p-1.5 xs:p-2 -ml-0.5 rounded-lg hover:bg-gray-100 touch-target" aria-label={t('back')}>←</button>
            <button onClick={() => navigate('/')} className="p-1.5 xs:p-2 rounded-lg hover:bg-gray-100 touch-target" aria-label={t('navHome')}>🏠</button>
          </div>
          <h1 className="flex-1 min-w-0 text-sm xs:text-base min-390:text-lg font-bold text-[#1B64F2] truncate">
            {getBookName(selectedBookId, version)}
          </h1>
          <div className="flex items-center gap-1 xs:gap-1.5 shrink-0">
            <div className="flex rounded-lg overflow-hidden border border-[#E6EAF2]">
              <button onClick={() => setBibleVersion('ko')} className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9]'}`}>{t('korean')}</button>
              <button onClick={() => setBibleVersion('en')} className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 py-1.5 text-[11px] xs:text-xs font-medium ${version === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9]'}`}>{t('english')}</button>
            </div>
            <button onClick={() => setShowExplanation(!showExplanation)} className={`min-h-[44px] min-w-[44px] px-2 xs:px-2.5 py-1.5 text-[11px] xs:text-xs font-medium rounded-lg border border-[#E6EAF2] ${showExplanation ? 'bg-[#1B64F2] text-white border-[#1B64F2]' : 'bg-white text-[#5B6475] hover:bg-[#f1f5f9]'}`}>{t('bibleTranslationToggle')}</button>
            <button onClick={goToPicker} className="min-h-[44px] px-2 xs:px-2.5 py-1.5 text-[11px] xs:text-xs font-medium rounded-lg border border-[#E6EAF2] bg-white text-[#5B6475] hover:bg-[#f1f5f9] whitespace-nowrap">{t('selectOtherBook')}</button>
          </div>
        </div>
        <div className="px-2 xs:px-3 min-390:px-4 pb-2 min-375:pb-3">
          <div className="relative flex items-center gap-1.5 xs:gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('bibleSearchPlaceholder')}
              className="flex-1 min-w-0 h-10 xs:h-11 pl-2.5 xs:pl-3 pr-3 xs:pr-4 py-2 rounded-lg xs:rounded-xl border border-[#E6EAF2] text-[13px] xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B64F2] focus:border-transparent"
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-0.5 xs:gap-1 shrink-0">
                <span className="text-[11px] xs:text-xs text-[#5B6475] whitespace-nowrap">{currentMatchIndex + 1}/{searchResults.length}</span>
                <button onClick={goPrev} className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-[#EEF4FF] text-[#1B64F2] hover:bg-[#E6EAF2] font-medium touch-target shrink-0" aria-label="이전">▲</button>
                <button onClick={goNext} className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-[#EEF4FF] text-[#1B64F2] hover:bg-[#E6EAF2] font-medium touch-target shrink-0" aria-label="다음">▼</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-2 xs:px-3 min-375:px-4 min-428:px-5 sm:px-6 py-3 xs:py-4 min-390:py-5 sm:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto" style={{ height: `${rowVirtualizer.getTotalSize() + 24}px`, position: 'relative', width: '100%', paddingTop: 12, paddingBottom: 12 }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = flatItems[virtualRow.index];
            if (!item) return null;
            return (
              <VirtualRow
                key={String(virtualRow.key)}
                item={item}
                virtualIndex={virtualRow.index}
                virtualStart={virtualRow.start}
                version={version}
                searchQuery={deferredSearchQuery}
                showExplanation={showExplanation}
                highlightedVerseKey={highlightedVerseKey}
                measureRef={rowVirtualizer.measureElement}
                setVerseRef={(key, el) => { if (el) verseRefs.current.set(key, el); }}
                getBookName={getBookName}
                t={t}
                highlightText={highlightText}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
