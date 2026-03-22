import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BIBLE_BOOKS_ORDER } from '../data/bibleSchedule';
import { useBibleStore } from '../store/bibleStore';
import { useTranslation } from '../hooks/useTranslation';
import { getBookName } from '../services/bibleText';
import { BottomNav } from '../components/BottomNav';
import { toast } from '../components/Toast';

const POPULAR_BOOKS = ['genesis', 'exodus', 'psalms', 'proverbs', 'isaiah', 'matthew', 'mark', 'luke', 'john', 'romans'];

export default function BibleSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { startBookId, bibleVersion, setBibleVersion, setStartBook, setCurrentDay, resetReadPlan } = useBibleStore();
  const [selected, setSelected] = useState(startBookId);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleApply = () => {
    setStartBook(selected);
    setCurrentDay(1);
    toast(t('settingsApplied'));
    navigate('/read');
  };

  const handleReset = () => {
    if (resetConfirm) {
      resetReadPlan();
      setResetConfirm(false);
      toast(t('resetDone'));
      navigate('/read');
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] pb-24 overflow-x-hidden w-full max-w-full">
      <header className="sticky top-0 z-10 bg-white border-b border-[#E6EAF2] shadow-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-2 xs:px-3 min-375:px-4 min-390:px-5 py-2.5 xs:py-3 min-390:py-3.5">
          <button
            onClick={() => navigate('/')}
            className="text-[#5B6475] text-sm font-medium"
          >
            {t('back')}
          </button>
          <span className="text-[#0B1220] font-semibold">{t('readSettings')}</span>
          <span className="w-12" />
        </div>
      </header>

      <div className="p-2 xs:p-3 min-375:p-4 min-390:p-5 sm:p-6 max-w-2xl mx-auto w-full box-border">
        <div className="mb-4 xs:mb-6">
          <p className="text-[#5B6475] text-xs xs:text-sm mb-2 font-medium">{t('bibleVersionLabel')}</p>
          <div className="flex rounded-lg xs:rounded-xl overflow-hidden border border-[#E6EAF2] bg-white">
            <button
              onClick={() => setBibleVersion('ko')}
              className={`flex-1 min-h-[48px] py-2.5 xs:py-3 text-sm font-medium ${bibleVersion === 'ko' ? 'bg-[#1B64F2] text-white' : 'text-[#5B6475]'}`}
            >
              {t('krvLabel')}
            </button>
            <button
              onClick={() => setBibleVersion('en')}
              className={`flex-1 min-h-[48px] py-2.5 xs:py-3 text-sm font-medium ${bibleVersion === 'en' ? 'bg-[#1B64F2] text-white' : 'text-[#5B6475]'}`}
            >
              {t('kjvLabel')}
            </button>
          </div>
        </div>

        <p className="text-[#5B6475] text-sm mb-4">
          {t('startBookPrompt')}
        </p>

        <div className="bg-white rounded-xl xs:rounded-2xl border border-[#E6EAF2] overflow-hidden mb-4">
          <p className="px-4 py-2 text-[#94a3b8] text-xs font-medium bg-[#f8fafc] border-b border-[#E6EAF2]">{t('bookGroupGenesis')}</p>
          <div className="max-h-[40dvh] overflow-y-auto overscroll-contain">
            {BIBLE_BOOKS_ORDER.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelected(book.id)}
                className={`w-full min-h-[48px] text-left px-4 xs:px-6 py-3 xs:py-4 flex items-center justify-between border-b border-[#E6EAF2] last:border-0 text-sm xs:text-base ${
                  selected === book.id ? 'bg-[#EEF4FF] text-[#1B64F2]' : 'text-[#0B1220]'
                }`}
              >
                <span className="font-medium">{getBookName(book.id, bibleVersion)}</span>
                {selected === book.id && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full mt-4 xs:mt-6 min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl bg-[#1B64F2] text-white font-semibold text-sm xs:text-base"
        >
          {t('startFromBook')}
        </button>

        <p className="text-[#94a3b8] text-xs mt-4 text-center">
          {t('chronologicalNote')}
        </p>

        <div className="mt-8 pt-6 border-t border-[#E6EAF2]">
          <button
            onClick={handleReset}
            className={`w-full min-h-[44px] py-3 rounded-xl text-sm font-medium ${resetConfirm ? 'bg-red-100 text-red-600' : 'text-[#94a3b8] bg-[#f8fafc] border border-[#E6EAF2]'}`}
          >
            {resetConfirm ? `${t('resetReadPlan')} (${t('resetConfirmTap')})` : t('resetReadPlan')}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
