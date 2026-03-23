import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { BannerAd } from './BannerAd';

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
        <div className="border-b border-[#E6EAF2] px-2 xs:px-3 pt-2">
          <BannerAd />
        </div>
      )}
      <div className="flex justify-around py-2.5 xs:py-3 px-3 xs:px-4 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 text-xs ${isActive('/') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
        >
          <span>🏠</span> {t('navHome')}
        </button>
        <button
          onClick={() => navigate('/read')}
          className={`flex flex-col items-center gap-1 text-xs ${isActive('/read') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
        >
          <span>📖</span> {t('todayRead')}
        </button>
        <button
          onClick={() => navigate('/progress')}
          className={`flex flex-col items-center gap-1 text-xs ${isActive('/progress') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
        >
          <span>📊</span> {t('navProgress')}
        </button>
        <button
          onClick={() => navigate('/journal')}
          className={`flex flex-col items-center gap-1 text-xs ${isActive('/journal') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
        >
          <span>📓</span> {t('journal')}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center gap-1 text-xs ${isActive('/settings') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
        >
          <span>⚙️</span> {t('settings')}
        </button>
      </div>
      <div className="h-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </nav>
  );
}
