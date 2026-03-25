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
        <div className="border-b border-[#E6EAF2] px-2 xs:px-3 pt-0.5 pb-0">
          <BannerAd />
        </div>
      )}
      {/* 로고: 정사각형(rounded) + 내부 패딩으로 object-contain 전체 노출 / 탭 줄 최대 압축 */}
      <div className="flex items-center gap-0 py-0.5 xs:py-1 pl-[max(0.35rem,env(safe-area-inset-left))] pr-[max(0.35rem,env(safe-area-inset-right))]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg active:opacity-80 touch-target -ml-0.5"
          aria-label={t('appTitle')}
        >
          <span className="size-[30px] xs:size-[34px] rounded-md bg-white shadow-sm ring-1 ring-[#E6EAF2] flex items-center justify-center p-[3px] box-border">
            <img
              src={BRAND_LOGO_SRC}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-contain"
              decoding="async"
            />
          </span>
        </button>
        <div className="flex flex-1 min-w-0 justify-evenly items-center gap-0 pl-0.5">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-0 leading-[1.08] text-[8px] xs:text-[9px] px-px ${isActive('/') ? 'text-[#1B64F2] font-semibold' : 'text-[#5B6475] font-medium'}`}
          >
            <span className="text-[11px] xs:text-xs leading-none mb-px" aria-hidden>🏠</span>
            <span className="text-center [word-break:keep-all]">{t('navHome')}</span>
          </button>
          <button
            onClick={() => navigate('/read')}
            className={`flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-0 leading-[1.08] text-[8px] xs:text-[9px] px-px ${isActive('/read') ? 'text-[#1B64F2] font-semibold' : 'text-[#5B6475] font-medium'}`}
          >
            <span className="text-[11px] xs:text-xs leading-none mb-px" aria-hidden>📖</span>
            <span className="text-center [word-break:keep-all]">{t('todayRead')}</span>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-0 leading-[1.08] text-[8px] xs:text-[9px] px-px ${isActive('/progress') ? 'text-[#1B64F2] font-semibold' : 'text-[#5B6475] font-medium'}`}
          >
            <span className="text-[11px] xs:text-xs leading-none mb-px" aria-hidden>📊</span>
            <span className="text-center [word-break:keep-all]">{t('navProgress')}</span>
          </button>
          <button
            onClick={() => navigate('/journal')}
            className={`flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-0 leading-[1.08] text-[8px] xs:text-[9px] px-px ${isActive('/journal') ? 'text-[#1B64F2] font-semibold' : 'text-[#5B6475] font-medium'}`}
          >
            <span className="text-[11px] xs:text-xs leading-none mb-px" aria-hidden>📓</span>
            <span className="text-center [word-break:keep-all]">{t('journal')}</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-0 leading-[1.08] text-[8px] xs:text-[9px] px-px ${isActive('/settings') ? 'text-[#1B64F2] font-semibold' : 'text-[#5B6475] font-medium'}`}
          >
            <span className="text-[11px] xs:text-xs leading-none mb-px" aria-hidden>⚙️</span>
            <span className="text-center [word-break:keep-all]">{t('settings')}</span>
          </button>
        </div>
      </div>
      <div
        className="shrink-0 w-full"
        style={{ height: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
        aria-hidden
      />
    </nav>
  );
}
