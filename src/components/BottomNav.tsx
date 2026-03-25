import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { BannerAd } from './BannerAd';

const BRAND_LOGO_SRC = '/brand-logo.png';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isActive = (path: string) => location.pathname === path;
  // 홈/성능 민감 화면에서는 배너 비노출
  const shouldShowBanner =
    location.pathname !== '/' &&
    location.pathname !== '/read' &&
    location.pathname !== '/bible';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6EAF2] z-50">
      {shouldShowBanner && (
        <div className="border-b border-[#E6EAF2] px-2 xs:px-3 pt-1.5">
          <BannerAd />
        </div>
      )}
      {/* 앱인토스: 공통 하단 내비 좌측 브랜드 로고(홈 탭 왼쪽) — 높이·패딩 약 15% 축소 */}
      <div className="flex items-center gap-0.5 xs:gap-1 py-1.5 xs:py-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="shrink-0 flex flex-col items-center justify-center min-w-[40px] min-h-[40px] rounded-full active:opacity-80 touch-target"
          aria-label={t('appTitle')}
        >
          <span className="h-8 w-8 xs:h-9 xs:w-9 rounded-full overflow-hidden shadow-sm ring-1 ring-[#E6EAF2] bg-white block">
            <img
              src={BRAND_LOGO_SRC}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              decoding="async"
            />
          </span>
        </button>
        <div className="flex flex-1 min-w-0 justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 text-[10px] xs:text-xs min-w-0 flex-1 max-w-[4.5rem] py-0.5 ${isActive('/') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.95em] leading-none">🏠</span> {t('navHome')}
          </button>
          <button
            onClick={() => navigate('/read')}
            className={`flex flex-col items-center gap-0.5 text-[10px] xs:text-xs min-w-0 flex-1 max-w-[4.5rem] py-0.5 ${isActive('/read') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.95em] leading-none">📖</span> {t('todayRead')}
          </button>
          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center gap-0.5 text-[10px] xs:text-xs min-w-0 flex-1 max-w-[4.5rem] py-0.5 ${isActive('/progress') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.95em] leading-none">📊</span> {t('navProgress')}
          </button>
          <button
            onClick={() => navigate('/journal')}
            className={`flex flex-col items-center gap-0.5 text-[10px] xs:text-xs min-w-0 flex-1 max-w-[4.5rem] py-0.5 ${isActive('/journal') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.95em] leading-none">📓</span> {t('journal')}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center gap-0.5 text-[10px] xs:text-xs min-w-0 flex-1 max-w-[4.5rem] py-0.5 ${isActive('/settings') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.95em] leading-none">⚙️</span> {t('settings')}
          </button>
        </div>
      </div>
      <div className="h-[max(0.35rem,env(safe-area-inset-bottom))]" />
    </nav>
  );
}
