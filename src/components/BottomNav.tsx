import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E6EAF2] flex justify-around py-2.5 xs:py-3 px-2 xs:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 text-[10px] xs:text-xs ${location.pathname === '/' ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
      >
        <span className="text-base">🏠</span> {t('home')}
      </button>
      <button
        onClick={() => navigate('/read')}
        className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 text-[10px] xs:text-xs ${isActive('/read') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
      >
        <span className="text-base">📖</span> {t('todayRead')}
      </button>
      <button
        onClick={() => navigate('/progress')}
        className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 text-[10px] xs:text-xs ${isActive('/progress') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
      >
        <span className="text-base">📊</span> {t('progressShort')}
      </button>
      <button
        onClick={() => navigate('/journal')}
        className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 text-[10px] xs:text-xs ${isActive('/journal') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
      >
        <span className="text-base">📓</span> {t('journal')}
      </button>
      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 text-[10px] xs:text-xs ${isActive('/settings') ? 'text-[#1B64F2] font-medium' : 'text-[#5B6475]'}`}
      >
        <span className="text-base">⚙️</span> {t('settings')}
      </button>
    </nav>
  );
}
