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
        <div className="border-b border-[#E6EAF2] px-2 xs:px-3 pt-1">
          <BannerAd />
        </div>
      )}
      {/* 앱인토스: 하단 내비 좌측 로고 — 원형+object-contain, 높이 추가 ~15% 축소 */}
      <div className="flex items-center gap-0.5 xs:gap-0.5 py-1 xs:py-1.5 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="shrink-0 flex flex-col items-center justify-center min-w-[36px] min-h-[36px] rounded-full active:opacity-80 touch-target"
          aria-label={t('appTitle')}
        >
          <span className="h-7 w-7 xs:h-8 xs:w-8 rounded-full overflow-hidden shadow-sm ring-1 ring-[#E6EAF2] bg-white flex items-center justify-center">
            <img
              src={BRAND_LOGO_SRC}
              alt=""
              width={32}
              height={32}
              className="max-h-full max-w-full object-contain"
              decoding="async"
            />
          </span>
        </button>
        <div className="flex flex-1 min-w-0 justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0 text-[9px] xs:text-[10px] min-w-0 flex-1 max-w-[4.5rem] py-px ${isActive('/') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.9em] leading-none">🏠</span> {t('navHome')}
          </button>
          <button
            onClick={() => navigate('/read')}
            className={`flex flex-col items-center gap-0 text-[9px] xs:text-[10px] min-w-0 flex-1 max-w-[4.5rem] py-px ${isActive('/read') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.9em] leading-none">📖</span> {t('todayRead')}
          </button>
          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center gap-0 text-[9px] xs:text-[10px] min-w-0 flex-1 max-w-[4.5rem] py-px ${isActive('/progress') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.9em] leading-none">📊</span> {t('navProgress')}
          </button>
          <button
            onClick={() => navigate('/journal')}
            className={`flex flex-col items-center gap-0 text-[9px] xs:text-[10px] min-w-0 flex-1 max-w-[4.5rem] py-px ${isActive('/journal') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.9em] leading-none">📓</span> {t('journal')}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center gap-0 text-[9px] xs:text-[10px] min-w-0 flex-1 max-w-[4.5rem] py-px ${isActive('/settings') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
          >
            <span className="text-[0.9em] leading-none">⚙️</span> {t('settings')}
          </button>
        </div>
      </div>
      <div className="h-[max(0.3rem,env(safe-area-inset-bottom))]" />
    </nav>
  );
}
