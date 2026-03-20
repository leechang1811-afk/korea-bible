import { useNavigate } from 'react-router-dom';
import { AuthBanner } from '../components/AuthBanner';
import { useTranslation } from '../hooks/useTranslation';
import { useBibleStore } from '../store/bibleStore';

export default function BibleHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { bibleVersion, setBibleVersion } = useBibleStore();

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white overflow-x-hidden w-full max-w-full">
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-[#E6EAF2] w-full">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <AuthBanner />
          </div>
          <p className="text-[#94a3b8] text-[10px] xs:text-xs text-right leading-relaxed shrink-0 py-2 px-3 xs:px-4">
            {t('homeSourceKJV')}
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-2 xs:px-3 min-375:px-4 sm:px-6 py-3 xs:py-4 min-390:py-5 sm:py-8 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-hidden w-full box-border">
        <div className="w-full max-w-md rounded-xl xs:rounded-2xl min-390:rounded-3xl p-3 xs:p-5 min-390:p-6 sm:p-8 pb-6 xs:pb-8 min-390:pb-10 sm:pb-12 bg-[#EEF4FF] border border-[#E6EAF2] mx-2 xs:mx-3 min-375:mx-4">
          <div className="flex flex-col items-center pb-3 xs:pb-5 min-390:pb-6">
            <div className="flex gap-1.5 xs:gap-2 mb-2 min-390:mb-2">
              <button
                onClick={() => setBibleVersion('ko')}
                className={`min-h-[44px] px-2 xs:px-2.5 min-390:px-3 py-1 rounded-lg text-[11px] xs:text-xs font-medium ${bibleVersion === 'ko' ? 'bg-[#1B64F2] text-white' : 'bg-white/80 text-[#5B6475]'}`}
              >
                <span className="xs:hidden">한</span>
                <span className="hidden xs:inline">한국어</span>
              </button>
              <button
                onClick={() => setBibleVersion('en')}
                className={`min-h-[44px] px-2 xs:px-2.5 min-390:px-3 py-1 rounded-lg text-[11px] xs:text-xs font-medium ${bibleVersion === 'en' ? 'bg-[#1B64F2] text-white' : 'bg-white/80 text-[#5B6475]'}`}
              >
                <span className="xs:hidden">EN</span>
                <span className="hidden xs:inline">English</span>
              </button>
            </div>
            <div className="relative w-10 h-12 mb-4" aria-hidden>
              <span className="absolute left-1/2 -translate-x-1/2 top-0 w-1.5 h-12 rounded-sm bg-amber-400" />
              <span
                className="absolute left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-sm bg-amber-400"
                style={{ top: '22%' }}
              />
            </div>
            <p className="text-[#5B6475] text-xs xs:text-sm font-medium text-center px-2">{t('homeTagline')}</p>
            <h1 className="text-[#1B64F2] text-lg xs:text-xl sm:text-2xl font-bold mt-2 text-center">{t('appTitle')}</h1>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium text-[#1B64F2] bg-white">{t('homeChronological')}</span>
          </div>
          <div className="space-y-2 xs:space-y-3">
            <button
              onClick={() => navigate('/verse-picker')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-white bg-[#1B64F2] hover:bg-[#1557e0] active:opacity-90"
            >
              {t('homeGetWord')}
            </button>
            <button
              onClick={() => navigate('/read')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#1B64F2] bg-white border-2 border-[#1B64F2] active:opacity-80"
            >
              {t('homeStart')}
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#1B64F2] bg-white border border-[#E6EAF2] active:opacity-80"
            >
              📊 {t('homeProgress')}
            </button>
            <button
              onClick={() => navigate('/bible')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#5B6475] bg-white border border-[#E6EAF2] active:opacity-80"
            >
              {t('homeBibleBook')}
            </button>
            <button
              onClick={() => navigate('/journal')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#1B64F2] bg-white border border-[#E6EAF2] active:opacity-80"
            >
              {t('homeMyMemo')}
            </button>
            <button
              onClick={() => navigate('/journal?tab=bookmarks')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#1B64F2] bg-white border border-[#E6EAF2] active:opacity-80"
            >
              {t('homeBookmarks')}
            </button>
            <button
              onClick={() => navigate('/journal?tab=verses')}
              className="w-full min-h-[48px] py-3.5 xs:py-4 rounded-xl xs:rounded-2xl font-semibold text-sm xs:text-base text-[#1B64F2] bg-white border border-[#E6EAF2] active:opacity-80"
            >
              {t('homeDailyVerses')}
            </button>
          </div>
          <p className="text-[#94a3b8] text-[10px] xs:text-xs text-center mt-4 xs:mt-6 leading-relaxed px-1">
            {t('homeDonationLine1')}
            <br />
            {t('homeDonationLine2')}
          </p>
        </div>
      </div>
    </div>
  );
}
