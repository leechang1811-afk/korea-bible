import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBibleStore, type BibleMemo, type BibleBookmark, type BibleDailyVerse } from '../store/bibleStore';
import { useTranslation } from '../hooks/useTranslation';
import { BottomNav } from '../components/BottomNav';

function isMemo(x: BibleMemo | BibleBookmark): x is BibleMemo {
  return 'memo1' in x && 'question1' in x;
}

export default function BibleJournal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const { t } = useTranslation();
  const { getMemosByDate, getDailyVersesByDate, searchMemos, searchDailyVerses, deleteMemo, removeBookmark, removeDailyVerse, memos, bookmarks, dailyVerses } = useBibleStore();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'search'>('list');

  const byDateRaw = useMemo(() => {
    const data = getMemosByDate();
    if (tab === 'bookmarks') {
      return data.map((d) => ({
        ...d,
        items: d.items.filter((x) => !isMemo(x)),
      })).filter((d) => d.items.length > 0);
    }
    return data;
  }, [getMemosByDate, memos, bookmarks, tab]);

  const byDate = useMemo(() => {
    if (!dateFilter.trim()) return byDateRaw;
    return byDateRaw.filter((d) => d.date === dateFilter);
  }, [byDateRaw, dateFilter]);

  const versesByDateRaw = useMemo(
    () => getDailyVersesByDate(),
    [getDailyVersesByDate, dailyVerses]
  );

  const versesByDate = useMemo(() => {
    if (!dateFilter.trim()) return versesByDateRaw;
    return versesByDateRaw.filter((d) => d.date === dateFilter);
  }, [versesByDateRaw, dateFilter]);

  const searchResults = useMemo(
    () => (search.trim() ? searchMemos(search) : []),
    [search, searchMemos, memos, bookmarks]
  );

  const verseSearchResults = useMemo(
    () => (search.trim() ? searchDailyVerses(search) : []),
    [search, searchDailyVerses, dailyVerses]
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] pb-24 xs:pb-28 overflow-x-hidden w-full max-w-full">
      <header className="sticky top-0 z-10 bg-white border-b border-[#E6EAF2] shadow-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-3 xs:px-4 py-2.5 xs:py-3">
          <button
            onClick={() => navigate('/')}
            className="text-[#5B6475] text-sm font-medium"
          >
            {t('back')}
          </button>
          <span className="text-[#0B1220] font-semibold">{t('myJournal')}</span>
          <span className="w-12" />
        </div>
      </header>

      <div className="p-3 xs:p-4 sm:p-6 max-w-2xl mx-auto w-full box-border">
        {/* 탭 */}
        <div className="flex gap-1.5 xs:gap-2 mb-4 xs:mb-6 overflow-x-auto -mx-3 xs:-mx-4 px-3 xs:px-4 scrollbar-none">
          <button
            onClick={() => navigate('/journal')}
            className={`flex-shrink-0 px-3 xs:px-4 py-2 min-h-[40px] rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium ${tab !== 'bookmarks' && tab !== 'verses' ? 'bg-[#1B64F2] text-white' : 'bg-[#E6EAF2] text-[#5B6475]'}`}
            title={t('tabMemoDesc')}
          >
            {t('tabMemo')}
          </button>
          <button
            onClick={() => navigate('/journal?tab=bookmarks')}
            className={`flex-shrink-0 px-3 xs:px-4 py-2 min-h-[40px] rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium ${tab === 'bookmarks' ? 'bg-[#1B64F2] text-white' : 'bg-[#E6EAF2] text-[#5B6475]'}`}
            title={t('tabBookmarksDesc')}
          >
            {t('tabBookmarks')}
          </button>
          <button
            onClick={() => navigate('/journal?tab=verses')}
            className={`flex-shrink-0 px-3 xs:px-4 py-2 min-h-[40px] rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium ${tab === 'verses' ? 'bg-[#1B64F2] text-white' : 'bg-[#E6EAF2] text-[#5B6475]'}`}
            title={t('tabVersesDesc')}
          >
            {t('tabVerses')}
          </button>
        </div>
        {/* 찾기 - 토스 스타일: 날짜 검색 · 텍스트 검색 */}
        <div className="mb-4 xs:mb-6">
          <div className="rounded-xl xs:rounded-2xl overflow-hidden bg-white border border-[#E6EAF2] p-3 xs:p-4 space-y-3 xs:space-y-4">
            <div>
              <p className="text-[#5B6475] text-[11px] xs:text-xs font-medium mb-1.5">{t('dateFilterLabel')}</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="journal-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 min-w-0 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl border border-[#E6EAF2] bg-[#f8fafc] text-[#0B1220] text-sm"
                  aria-label={t('dateFilterLabel')}
                />
                <button
                  onClick={() => setDateFilter('')}
                  className={`flex-shrink-0 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-lg xs:rounded-xl text-sm font-medium touch-target ${
                    dateFilter ? 'bg-[#EEF4FF] text-[#1B64F2] border border-[#1B64F2]' : 'bg-[#f8fafc] text-[#94a3b8] border border-[#E6EAF2]'
                  }`}
                  aria-label={t('reset')}
                >
                  {t('reset')}
                </button>
              </div>
            </div>
            <div>
              <p className="text-[#5B6475] text-[11px] xs:text-xs font-medium mb-1.5">{t('searchLabel')}</p>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setViewMode(e.target.value.trim() ? 'search' : 'list');
                }}
                placeholder={tab === 'verses' ? t('searchVerse') : t('searchMemo')}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl border border-[#E6EAF2] bg-[#f8fafc] text-sm text-[#0B1220] placeholder-[#94a3b8]"
                aria-label={t('searchLabel')}
              />
            </div>
          </div>
        </div>

        {tab === 'verses' ? (
          viewMode === 'search' && search.trim() ? (
            <div className="space-y-4">
              <h3 className="text-[#5B6475] text-sm font-medium">{t('searchResultsCount', { count: verseSearchResults.length })}</h3>
              {verseSearchResults.length === 0 ? (
                <p className="text-[#94a3b8] text-center py-8">{t('noResults')}</p>
              ) : (
                verseSearchResults.map((item) => (
                  <div key={item.id}>
                    <p className="text-[#5B6475] text-xs mb-1">{item.date}</p>
                    <DailyVerseCard
                      item={item}
                      onDelete={() => removeDailyVerse(item.id)}
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-[#5B6475] text-sm font-medium">
                {dateFilter ? t('receivedByDateFilter', { date: dateFilter }) : t('receivedByDate')}
              </h3>
              {versesByDate.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#94a3b8]">{dateFilter ? t('noVersesDate') : t('noVerses')}</p>
                  {dateFilter ? (
                    <button onClick={() => setDateFilter('')} className="text-[#1B64F2] mt-3 text-sm font-medium">{t('resetDate')}</button>
                  ) : (
                    <button onClick={() => navigate('/verse-picker')} className="mt-4 px-6 py-3 rounded-xl bg-[#1B64F2] text-white text-sm font-semibold">{t('goGetWord')}</button>
                  )}
                </div>
              ) : (
                versesByDate.map(({ date, items }) => (
                  <div key={date}>
                    <p className="text-[#5B6475] text-sm font-medium mb-3">{date}</p>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <DailyVerseCard
                          key={item.id}
                          item={item}
                          onDelete={() => removeDailyVerse(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        ) : viewMode === 'search' && search.trim() ? (
          <div className="space-y-4">
            <h3 className="text-[#5B6475] text-sm font-medium">
              {t('searchResultsCount', { count: searchResults.length })}
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-[#94a3b8] text-center py-8">{t('noResults')}</p>
            ) : (
              searchResults.map((item) => (
                <JournalCard
                  key={item.id}
                  item={item}
                  onDelete={isMemo(item) ? () => deleteMemo(item.id) : () => removeBookmark(item.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[#5B6475] text-sm font-medium">
              {dateFilter
                ? (tab === 'bookmarks' ? t('bookmarksFiltered', { date: dateFilter }) : t('memoFiltered', { date: dateFilter }))
                : (tab === 'bookmarks' ? t('bookmarksByDate') : t('memoByDate'))}
            </h3>
            {byDate.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#94a3b8]">
                  {dateFilter
                    ? t('noDataDate')
                    : tab === 'bookmarks'
                      ? t('noBookmarks')
                      : t('noMemos')}
                </p>
                {dateFilter ? (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-[#1B64F2] mt-3 text-sm font-medium"
                  >
                    {t('resetDate')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/read')}
                    className="mt-4 px-6 py-3 rounded-xl bg-[#1B64F2] text-white text-sm font-semibold"
                  >
                    {tab === 'bookmarks' ? t('goRead') : t('goDailyRead')}
                  </button>
                )}
              </div>
            ) : (
              byDate.map(({ date, items }) => (
                <div key={date}>
                  <p className="text-[#5B6475] text-sm font-medium mb-3">{date}</p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <JournalCard
                        key={item.id}
                        item={item}
                        onDelete={isMemo(item) ? () => deleteMemo(item.id) : () => removeBookmark(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function DailyVerseCard({
  item,
  onDelete,
}: {
  item: BibleDailyVerse;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      className="bg-white rounded-xl xs:rounded-2xl border border-[#E6EAF2] overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full min-h-[48px] text-left px-4 xs:px-6 py-3 xs:py-4 flex items-center justify-between gap-2"
      >
        <span className="font-semibold text-[#1B64F2] text-sm xs:text-base truncate">
          {item.bookName} {item.chapter}:{item.verse}
        </span>
        <span className="text-[#94a3b8]">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 xs:px-6 pb-4 xs:pb-6 pt-0 border-t border-[#E6EAF2]">
          <p className="text-[#0B1220] text-sm xs:text-base leading-relaxed mt-3 xs:mt-4 break-words">
            {item.explanation ?? item.text}
          </p>
          {item.explanation && item.text && (
            <div className="mt-3 pl-3 border-l-2 border-[#E6EAF2] text-[#5B6475] text-sm">
              <span className="text-[#94a3b8] text-xs font-medium">{t('englishKJVLabel')}</span>
              <p className="mt-1 leading-relaxed">{item.text}</p>
            </div>
          )}
          {onDelete && (
            <button onClick={onDelete} className="mt-4 text-red-500 text-sm">
              {t('delete')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function JournalCard({
  item,
  onDelete,
}: {
  item: BibleMemo | BibleBookmark;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const isBk = !isMemo(item);
  const deleteLabel = isBk ? t('unbookmark') : t('delete');

  return (
    <motion.div
      layout
      className="bg-white rounded-xl xs:rounded-2xl border border-[#E6EAF2] overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full min-h-[48px] text-left px-4 xs:px-6 py-3 xs:py-4 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isBk && <span className="text-pink-500 flex-shrink-0" aria-hidden>♥</span>}
          <span className="font-semibold text-[#0B1220] text-sm xs:text-base truncate">{item.readingRef}</span>
        </div>
        <span className="text-[#94a3b8]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 xs:px-6 pb-4 xs:pb-6 pt-0 border-t border-[#E6EAF2]">
          {isMemo(item) && (
            <>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[#5B6475] text-xs mb-1">{t('question1')}</p>
                  <p className="text-[#0B1220] text-sm">{item.question1}</p>
                  <p className="text-[#64748b] text-sm mt-1">{item.memo1 || '-'}</p>
                </div>
                <div>
                  <p className="text-[#5B6475] text-xs mb-1">{t('question2')}</p>
                  <p className="text-[#0B1220] text-sm">{item.question2}</p>
                  <p className="text-[#64748b] text-sm mt-1">{item.memo2 || '-'}</p>
                </div>
                {item.dailyNote && (
                  <div>
                    <p className="text-[#5B6475] text-xs mb-1">{t('todayNote')}</p>
                    <p className="text-[#64748b] text-sm">{item.dailyNote}</p>
                  </div>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="mt-4 text-red-500 text-sm"
                >
                  {deleteLabel}
                </button>
              )}
            </>
          )}
          {isBk && (
            <>
              <p className="text-[#94a3b8] text-sm mt-2">{t('bookmarkedVerse')}</p>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="mt-2 text-red-500 text-sm"
                >
                  {deleteLabel}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
