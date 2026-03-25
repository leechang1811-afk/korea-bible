import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScheduleFromBook, getReadingByDayIndex } from '../data/bibleSchedule';
import { useBibleStore } from '../store/bibleStore';
import { useTranslation } from '../hooks/useTranslation';
import { BottomNav } from '../components/BottomNav';

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number) {
  if (month === 1 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month];
}

export default function BibleProgress() {
  const navigate = useNavigate();
  const { setCurrentDay } = useBibleStore();
  const { t } = useTranslation();
  const { startBookId, customOrder, completedDays } = useBibleStore();

  const schedule = useMemo(
    () => getScheduleFromBook(startBookId, customOrder ?? undefined),
    [startBookId, customOrder]
  );

  const totalDays = schedule.length;
  /** dayIndex당 가장 오래전에 체크한 것만 사용 (진도율·캘린더·목록) */
  const completedByOldest = useMemo(() => {
    const byDay = new Map<number, typeof completedDays[0]>();
    for (const c of completedDays) {
      const existing = byDay.get(c.dayIndex);
      if (!existing || c.date < existing.date || (c.date === existing.date && c.createdAt < existing.createdAt)) {
        byDay.set(c.dayIndex, c);
      }
    }
    return Array.from(byDay.values());
  }, [completedDays]);

  const completedDayIndexes = useMemo(
    () => new Set(completedByOldest.map((c) => c.dayIndex)),
    [completedByOldest]
  );
  const completedCount = completedDayIndexes.size;
  const rawPercent = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;
  // 초기 진도(1~2일)도 인지되도록: 1% 미만이면 소수 첫자리 표시, 0만 나오지 않게
  const percentDisplay =
    completedCount > 0 && rawPercent < 1 ? rawPercent.toFixed(1) : String(Math.round(rawPercent));

  const completedByDate = useMemo(() => {
    const set = new Set<string>();
    completedByOldest.forEach((c) => set.add(c.date));
    return set;
  }, [completedByOldest]);

  const completedListWithRef = useMemo(
    () =>
      completedByOldest
        .map((c) => {
          const r = getReadingByDayIndex(schedule, c.dayIndex);
          const ref = r ? `${r.book} ${r.startCh}${r.endCh !== r.startCh ? `-${r.endCh}` : ''}장` : '';
          return { ...c, readingRef: ref };
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [completedByOldest, schedule]
  );

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < startPad; i++) {
      const prev = new Date(viewYear, viewMonth, -startPad + i + 1);
      cells.push({
        date: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`,
        day: prev.getDate(),
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: true,
      });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const next = new Date(viewYear, viewMonth + 1, i);
      cells.push({
        date: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`,
        day: next.getDate(),
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] pb-[max(7.1rem,calc(env(safe-area-inset-bottom)+6.8rem))] overflow-x-hidden w-full max-w-full">
      <header className="sticky top-0 z-10 bg-white border-b border-[#E6EAF2] shadow-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-2 xs:px-3 min-375:px-4 min-390:px-5 py-2.5 xs:py-3 min-390:py-3.5">
          <button
            onClick={() => navigate('/')}
            className="text-[#5B6475] text-sm font-medium"
          >
            {t('back')}
          </button>
          <span className="text-[#0B1220] font-semibold">{t('progressTitle')}</span>
          <span className="w-12" />
        </div>
      </header>

      <div className="p-2 xs:p-3 min-375:p-4 min-390:p-5 sm:p-6 max-w-2xl mx-auto w-full box-border">
        {/* 게이지 */}
        <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-6 mb-4 xs:mb-6 border border-[#E6EAF2]">
          {completedCount === 0 && (
            <p className="text-[#1B64F2] text-sm font-medium mb-3">{t('progressZeroMsg')}</p>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#5B6475] text-sm font-medium">{t('progressPercent', { percent: percentDisplay })}</span>
            <span className="text-[#1B64F2] text-sm font-semibold">{t('progressCompleted', { count: completedCount })}</span>
          </div>
          <div className="h-3 rounded-full bg-[#E6EAF2] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1B64F2] transition-all duration-500"
              style={{
                width: `${Math.min(100, completedCount > 0 && rawPercent < 2 ? Math.max(rawPercent, 2) : rawPercent)}%`,
              }}
            />
          </div>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-[#E6EAF2]">
          <h3 className="text-[#0B1220] font-semibold text-base mb-4">{t('progressCalendar')}</h3>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrevMonth}
              className="w-9 h-9 rounded-lg bg-[#EEF4FF] text-[#1B64F2] flex items-center justify-center font-medium"
            >
              ‹
            </button>
            <span className="text-[#0B1220] font-medium">{monthLabel}</span>
            <button
              onClick={goNextMonth}
              className="w-9 h-9 rounded-lg bg-[#EEF4FF] text-[#1B64F2] flex items-center justify-center font-medium"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} className="text-[#94a3b8] text-xs font-medium py-1">
                {d}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              const completed = completedByDate.has(cell.date);
              const item = completedListWithRef.find((c) => c.date === cell.date);
              const canGo = completed && item && cell.isCurrentMonth;
              return (
                <button
                  key={`${cell.date}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (canGo && item) {
                      setCurrentDay(item.dayIndex);
                      navigate('/read');
                    }
                  }}
                  className={`min-h-[36px] flex flex-col items-center justify-center rounded-lg text-sm ${
                    !cell.isCurrentMonth ? 'text-[#cbd5e1]' : 'text-[#0B1220]'
                  } ${completed ? 'bg-[#1B64F2] text-white font-semibold' : ''} ${canGo ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                >
                  {cell.day}
                  {completed && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* 완료한 날짜 + 읽은 구절 목록 */}
          {completedListWithRef.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#E6EAF2]">
              <p className="text-[#5B6475] text-xs mb-2 font-medium">{t('progressCompletedDates')}</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {completedListWithRef.slice(0, 50).map((c) => (
                  <div
                    key={`${c.dayIndex}-${c.date}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EEF4FF] text-[#1B64F2] text-xs"
                  >
                    <span className="font-medium shrink-0">{c.date}</span>
                    <span className="truncate">{c.readingRef}</span>
                    <span className="shrink-0 ml-auto">✓</span>
                  </div>
                ))}
                {completedListWithRef.length > 50 && (
                  <span className="text-[#94a3b8] text-xs">+{completedListWithRef.length - 50}일</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
