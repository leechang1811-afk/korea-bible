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
      <div className="min-h-screen bg-[#f8fafc] p-6 flex flex-col items-center justify-center">
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
            {/* 1) 메인: 오늘의 말씀 제목 + 날짜 네비 */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setCurrentDay(Math.max(1, currentDayIndex - 1))}
                  disabled={currentDayIndex <= 1}
                  className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#5B6475] disabled:opacity-40 touch-target shrink-0"
                  aria-label="이전"
                >
                  ‹
                </button>
                <h2 className="text-lg xs:text-xl font-bold text-[#0B1220] truncate">{refText}</h2>
                <button
                  onClick={() => setCurrentDay(currentDayIndex + 1)}
                  disabled={currentDayIndex >= schedule.length}
                  className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#5B6475] disabled:opacity-40 touch-target shrink-0"
                  aria-label="다음"
                >
                  ›
                </button>
              </div>
              <span className="text-[#94a3b8] text-xs shrink-0">{t('dayN', { n: currentDayIndex })}</span>
            </div>

            {/* 2) 단일 툴바: 한/EN | 🔊 | ♡ | ✓ | ⋯ */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <div className="flex rounded-lg overflow-hidden border border-[#E6EAF2]">
                <button
                  onClick={() => setBibleVersion('ko')}
                  className={`px-2.5 py-1.5 text-xs font-medium touch-target ${bibleVersion === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}
                >
                  한
                </button>
                <button
                  onClick={() => setBibleVersion('en')}
                  className={`px-2.5 py-1.5 text-xs font-medium touch-target ${bibleVersion === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white text-[#5B6475]'}`}
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
                title={ttsPlaying ? t('stopTTS') : t('listen')}
              >
                {ttsPlaying ? '⏹' : '🔊'}
              </button>
              {ttsPlaying && (
                <button
                  onClick={handleReplayFromStart}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EEF4FF] text-[#1B64F2] touch-target"
                  title={t('replayFromStart')}
                >
                  🔄
                </button>
              )}
              <button
                onClick={handleBookmark}
                className={`w-9 h-9 rounded-lg flex items-center justify-center touch-target text-lg ${
                  bookmarked ? 'text-pink-500 bg-pink-50' : 'bg-[#EEF4FF] text-[#94a3b8]'
                }`}
                title={bookmarked ? t('unbookmark') : t('bookmark')}
              >
                {bookmarked ? '♥' : '♡'}
              </button>
              <button
                onClick={() => toggleDayComplete(currentDayIndex, today)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center touch-target text-sm font-medium ${
                  isDayComplete(currentDayIndex, today)
                    ? 'bg-[#1B64F2] text-white'
                    : 'bg-[#E6EAF2] text-[#5B6475]'
                }`}
                title={t('readConfirm')}
              >
                {isDayComplete(currentDayIndex, today) ? '✓' : '○'}
              </button>
              <button
                onClick={() => { setStartBook('genesis'); setCurrentDay(1); navigate('/settings'); }}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#f1f5f9] text-[#5B6475] touch-target ml-auto"
                title={t('selectOtherBook')}
              >
                ⋯
              </button>
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

      {/* 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6EAF2] flex justify-around py-2.5 xs:py-3 px-3 xs:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center gap-1 text-[#5B6475] text-xs"
        >
          <span>⚙️</span> {t('settings')}
        </button>
        <button
          onClick={() => navigate('/read')}
          className="flex flex-col items-center gap-1 text-[#1B64F2] text-xs font-medium"
        >
          <span>📖</span> {t('todayRead')}
        </button>
        <button
          onClick={() => navigate('/journal')}
          className="flex flex-col items-center gap-1 text-[#5B6475] text-xs"
        >
          <span>📓</span> {t('journal')}
        </button>
      </nav>
    </div>
  );
}
