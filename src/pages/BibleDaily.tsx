import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getScheduleFromBook,
  getReadingByDayIndex,
  type ReadingItem,
} from '../data/bibleSchedule';
import { getMeditationQuestion } from '../data/meditationQuestions';
import { useBibleStore } from '../store/bibleStore';
import { useBibleTTS } from '../hooks/useBibleTTS';
import { getVerses, getBookName } from '../services/bibleText';
import { useTranslation } from '../hooks/useTranslation';
import { BottomNav } from '../components/BottomNav';

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BibleDaily() {
  const navigate = useNavigate();
  const today = getTodayDateString();

  const {
    startBookId,
    customOrder,
    currentDayIndex,
    bibleVersion,
    setBibleVersion,
    setStartBook,
    setCurrentDay,
    addBookmark,
    removeBookmark,
    isBookmarked,
    saveMemo,
    memos,
    toggleDayComplete,
    isDayComplete,
  } = useBibleStore();

  const schedule = useMemo(
    () => getScheduleFromBook(startBookId, customOrder ?? undefined),
    [startBookId, customOrder]
  );

  const reading = getReadingByDayIndex(schedule, currentDayIndex);
  const { t, locale } = useTranslation();
  const q = reading ? getMeditationQuestion(reading.bookId, locale) : '';

  const [memo1, setMemo1] = useState('');
  const [dailyNote, setDailyNote] = useState('');
  const [verses, setVerses] = useState<{ chapter: number; verse: number; text: string; explanation?: string }[]>([]);
  const [versesLoading, setVersesLoading] = useState(true);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsCurrentVerseRef = useRef(0);
  const [ttsStoppedAtIndex, setTtsStoppedAtIndex] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [moreOpen]);

  useEffect(() => {
    if (!reading) return;
    setVersesLoading(true);
    getVerses(reading.bookId, reading.startCh, reading.endCh, bibleVersion)
      .then(setVerses)
      .catch(() => setVerses([]))
      .finally(() => setVersesLoading(false));
  }, [reading?.bookId, reading?.startCh, reading?.endCh, bibleVersion]);

  const existingMemo = useMemo(
    () => memos.find((m) => m.dayIndex === currentDayIndex && m.date === today),
    [memos, currentDayIndex, today]
  );

  useEffect(() => {
    if (existingMemo) {
      setMemo1(existingMemo.memo1);
      setDailyNote(existingMemo.dailyNote);
    } else {
      setMemo1('');
      setDailyNote('');
    }
  }, [existingMemo, currentDayIndex, today]);

  const { speak, speakVerses, stop, getReadingTextForTTS, toSinoKorean } = useBibleTTS();

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      const load = () => speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setTtsPlaying(false);
    setTtsStoppedAtIndex(null);
  }, [reading?.bookId, reading?.startCh, reading?.endCh]);

  const bookmarked = reading && isBookmarked(reading.dayIndex, today);

  const handleBookmark = () => {
    if (!reading) return;
    if (bookmarked) {
      const b = useBibleStore.getState().bookmarks.find(
        (x) => x.dayIndex === reading.dayIndex && x.date === today
      );
      if (b) useBibleStore.getState().removeBookmark(b.id);
    } else {
      addBookmark(reading, today);
    }
  };

  const handleSaveMemo = () => {
    if (!reading) return;
    if (existingMemo) {
      useBibleStore.getState().updateMemo(existingMemo.id, {
        memo1,
        dailyNote,
      });
    } else {
      saveMemo({
        dayIndex: reading.dayIndex,
        readingRef: `${reading.book} ${reading.startCh}${reading.endCh !== reading.startCh ? `-${reading.endCh}` : ''}장`,
        date: today,
        question1: q,
        question2: '',
        memo1,
        memo2: '',
        dailyNote,
      });
    }
  };

  const startPlayback = (fromIndex: number) => {
    if (!reading) return;
    const onEnd = () => {
      setTtsPlaying(false);
      setTtsStoppedAtIndex(null);
    };
    setTtsPlaying(true);
    setTtsStoppedAtIndex(null);
    if (verses.length > 0) {
      const isKo = bibleVersion === 'ko';
      const verseTexts = verses.map((v) => {
        if (isKo) {
          const numPart = `${toSinoKorean(v.chapter)}장 ${toSinoKorean(v.verse)}절`;
          const koreanText = v.explanation?.trim();
          return koreanText ? `${numPart}. ${koreanText}` : numPart;
        }
        return `Chapter ${v.chapter}, verse ${v.verse}. ${v.text}`;
      });
      speakVerses(
        verseTexts,
        1000,
        isKo ? 'ko-KR' : 'en-US',
        onEnd,
        fromIndex,
        (i) => { ttsCurrentVerseRef.current = i; }
      );
    } else {
      const text = getReadingTextForTTS(bookDisplay, reading.startCh, reading.endCh, bibleVersion);
      speak(text, bibleVersion === 'ko' ? 'ko-KR' : 'en-US', onEnd);
    }
  };

  const handleListen = () => {
    if (!reading) return;
    if (ttsPlaying) return;
    const startFrom = ttsStoppedAtIndex ?? 0;
    startPlayback(startFrom);
  };

  const handleStop = () => {
    if (!ttsPlaying) return;
    setTtsStoppedAtIndex(ttsCurrentVerseRef.current);
    stop();
    setTtsPlaying(false);
  };

  const handleReplayFromStart = () => {
    if (!reading) return;
    if (ttsPlaying) stop();
    startPlayback(0);
  };

  if (!reading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] p-6 flex flex-col items-center justify-center overflow-x-hidden w-full max-w-full">
        <p className="text-[#64748b]">{t('noReading')}</p>
        <button
          onClick={() => setCurrentDay(1)}
          className="mt-4 px-6 py-2 rounded-xl bg-[#1B64F2] text-white"
        >
          {t('goToDay1')}
        </button>
      </div>
    );
  }

  const bookDisplay = getBookName(reading.bookId, bibleVersion);
  const refText =
    bibleVersion === 'ko'
      ? `${bookDisplay} ${reading.startCh}${reading.endCh !== reading.startCh ? `-${reading.endCh}` : ''}장`
      : `${bookDisplay} ${reading.startCh}${reading.endCh !== reading.startCh ? `-${reading.endCh}` : ''}`;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] pb-24 xs:pb-28 overflow-x-hidden w-full max-w-full">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E6EAF2] shadow-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-2 xs:px-3 min-375:px-4 min-390:px-5 py-2.5 xs:py-3 min-390:py-3.5">
          <button
            onClick={() => navigate('/')}
            className="text-[#5B6475] text-sm font-medium"
          >
            {t('back')}
          </button>
          <span className="text-[#0B1220] font-semibold text-sm">
            {t('appTitle')}
          </span>
          <button
            onClick={() => navigate('/journal')}
            className="text-[#1B64F2] text-sm font-medium"
          >
            {t('journal')}
          </button>
        </div>
      </header>

      <div className="p-2 xs:p-3 min-375:p-4 min-390:p-5 sm:p-6 max-w-2xl mx-auto w-full box-border">
        {/* Reading card - 심플 토스 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-[#E6EAF2] overflow-hidden"
        >
          <div className="p-4 xs:p-5 sm:p-6">
            {/* 1) 메인: 제 N일 (일차 네비) + 오늘의 말씀 */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => setCurrentDay(Math.max(1, currentDayIndex - 1))}
                  disabled={currentDayIndex <= 1}
                  className="w-8 h-8 rounded-full bg-[#EEF4FF] flex items-center justify-center text-[#1B64F2] disabled:opacity-40 touch-target"
                  aria-label={t('prevDay')}
                  title={t('prevDay')}
                >
                  ‹
                </button>
                <span className="text-[#1B64F2] font-bold text-sm min-w-[4rem] text-center">
                  {t('dayN', { n: currentDayIndex })}
                </span>
                <button
                  onClick={() => setCurrentDay(currentDayIndex + 1)}
                  disabled={currentDayIndex >= schedule.length}
                  className="w-8 h-8 rounded-full bg-[#EEF4FF] flex items-center justify-center text-[#1B64F2] disabled:opacity-40 touch-target"
                  aria-label={t('nextDay')}
                  title={t('nextDay')}
                >
                  ›
                </button>
              </div>
              <p className="text-[#94a3b8] text-[11px] text-center mb-1">
                {t('daysOfTotal', { total: schedule.length })}
              </p>
              <h2 className="text-lg xs:text-xl font-bold text-[#0B1220] text-center break-words">{refText}</h2>
            </div>

            {/* 2) 툴바: 한/EN | 🔊 | 찜 | 읽음 | ⋯ + 레이블 */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <div className="flex rounded-lg overflow-hidden border border-[#E6EAF2]">
                <button
                  onClick={() => setBibleVersion('ko')}
                  className={`px-2.5 py-1.5 text-xs font-medium touch-target ${bibleVersion === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}
                  aria-label={t('korean')}
                >
                  한
                </button>
                <button
                  onClick={() => setBibleVersion('en')}
                  className={`px-2.5 py-1.5 text-xs font-medium touch-target ${bibleVersion === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}
                  aria-label={t('english')}
                >
                  EN
                </button>
              </div>
              <button
                onClick={ttsPlaying ? handleStop : handleListen}
                disabled={!reading && !ttsPlaying}
                className={`w-9 h-9 rounded-lg flex items-center justify-center touch-target ${
                  ttsPlaying ? 'bg-[#dc2626] text-white' : 'bg-[#EEF4FF] text-[#1B64F2]'
                }`}
                aria-label={ttsPlaying ? t('stopTTS') : t('listen')}
                title={ttsPlaying ? t('stopTTS') : t('listen')}
              >
                {ttsPlaying ? '⏹' : '🔊'}
              </button>
              {ttsPlaying && (
                <button
                  onClick={handleReplayFromStart}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EEF4FF] text-[#1B64F2] touch-target"
                  aria-label={t('replayFromStart')}
                  title={t('replayFromStart')}
                >
                  🔄
                </button>
              )}
              <button
                onClick={handleBookmark}
                className={`min-h-[36px] px-2.5 rounded-lg flex items-center gap-1.5 touch-target ${
                  bookmarked ? 'text-pink-500 bg-pink-50' : 'bg-[#EEF4FF] text-[#5B6475]'
                }`}
                aria-label={bookmarked ? t('unbookmark') : t('bookmark')}
                title={bookmarked ? t('unbookmark') : t('bookmark')}
              >
                <span className="text-lg">{bookmarked ? '♥' : '♡'}</span>
                <span className="text-[11px] font-medium hidden xs:inline">{t('bookmark')}</span>
              </button>
              <button
                onClick={() => toggleDayComplete(currentDayIndex, today)}
                className={`min-h-[36px] px-2.5 rounded-lg flex items-center gap-1.5 touch-target ${
                  isDayComplete(currentDayIndex)
                    ? 'bg-[#1B64F2] text-white'
                    : 'bg-[#E6EAF2] text-[#5B6475]'
                }`}
                aria-label={t('readConfirm')}
                title={t('readConfirmTooltip')}
              >
                <span className="text-sm font-medium">{isDayComplete(currentDayIndex) ? '✓' : '○'}</span>
                <span className="text-[11px] font-medium hidden xs:inline">{t('readConfirm')}</span>
              </button>
              <div className="relative ml-auto" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#f1f5f9] text-[#5B6475] touch-target"
                  aria-label={t('selectOtherBook')}
                  aria-expanded={moreOpen}
                >
                  ⋯
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-1 py-1.5 rounded-xl bg-white border border-[#E6EAF2] shadow-lg z-20 min-w-[180px]">
                    <button
                      onClick={() => { setMoreOpen(false); setStartBook('genesis'); setCurrentDay(1); navigate('/settings'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#0B1220] hover:bg-[#f8fafc]"
                    >
                      {t('selectOtherBook')}
                    </button>
                    <button
                      onClick={() => { setMoreOpen(false); navigate('/settings'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#0B1220] hover:bg-[#f8fafc]"
                    >
                      {t('settings')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3) 본문 내용 */}
            <div className="pt-4 border-t border-[#E6EAF2]">
              <p className="text-[#94a3b8] text-[11px] mb-4">
                {t('bibleSourceKJV')}
              </p>
              {versesLoading ? (
                <p className="text-[#94a3b8] text-sm">
                  {t('loading')}
                </p>
              ) : verses.length > 0 ? (
                <div className="space-y-2 xs:space-y-3 text-[#0B1220] text-[15px] xs:text-base leading-[1.7] xs:leading-relaxed break-words">
                  {verses.map((v, i) => (
                    <div key={i} className="space-y-1">
                      <p>
                        <span className="text-[#1B64F2] font-medium text-sm">
                          {v.chapter}:{v.verse}{' '}
                        </span>
                        {bibleVersion === 'ko' ? (
                          <span className="font-semibold text-[#0B1220]">{v.explanation ?? v.text}</span>
                        ) : (
                          <span className="font-semibold">{v.text}</span>
                        )}
                      </p>
                      {bibleVersion === 'ko' && v.text && (
                        <p className="text-sm pl-1 border-l-2 border-[#E6EAF2] ml-1 font-normal text-[#5B6475]">
                          <span className="text-[#94a3b8] text-xs font-medium">{t('englishKJVLabel')}</span> {v.text}
                        </p>
                      )}
                      {bibleVersion === 'en' && v.explanation && (
                        <p className="text-sm pl-1 border-l-2 border-[#E6EAF2] ml-1 font-normal text-[#5B6475]">
                          <span className="text-[#94a3b8] text-xs font-medium">{t('explanationLabel')}</span> {v.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#94a3b8] text-sm">
                  {t('loadError')}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* 묵상 질문 */}
        <div className="mt-4 xs:mt-6 space-y-3 xs:space-y-4">
          <h3 className="text-[#0B1220] font-semibold text-base xs:text-lg">{t('meditationTitle')}</h3>

          <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 shadow-sm border border-[#E6EAF2]">
            <p className="text-[#5B6475] text-sm mb-2 font-medium">{t('question1')}</p>
            <p className="text-[#0B1220] mb-4">{q}</p>
            <textarea
              value={memo1}
              onChange={(e) => setMemo1(e.target.value)}
              placeholder={t('memoPlaceholder')}
              className="w-full min-h-[72px] xs:min-h-[80px] p-3 xs:p-4 rounded-xl border border-[#E6EAF2] text-[15px] xs:text-base text-[#0B1220] placeholder-[#94a3b8] resize-none"
            />
          </div>

          <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 shadow-sm border border-[#E6EAF2]">
            <p className="text-[#5B6475] text-sm mb-2 font-medium">{t('todayNote')}</p>
            <textarea
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              placeholder={t('todayPlaceholder')}
              className="w-full min-h-[88px] xs:min-h-[100px] p-3 xs:p-4 rounded-xl border border-[#E6EAF2] text-[15px] xs:text-base text-[#0B1220] placeholder-[#94a3b8] resize-none"
            />
          </div>

          <button
            onClick={handleSaveMemo}
            className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl bg-[#1B64F2] text-white font-semibold text-sm xs:text-base"
          >
            {existingMemo ? t('updateSave') : t('save')}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
