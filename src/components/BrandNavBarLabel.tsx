import { useTranslation } from '../hooks/useTranslation';

/** 앱인토스 심사: 공통 내비/헤더에 브랜드(앱명) 노출 */
export function BrandNavBarLabel({ variant = 'nav' }: { variant?: 'nav' | 'header' }) {
  const { t } = useTranslation();
  const edge =
    variant === 'header' ? 'border-t border-[#E6EAF2]' : 'border-b border-[#E6EAF2]';

  return (
    <div
      className={`flex justify-center items-center min-h-[28px] px-3 bg-[#f8fafc] ${edge}`}
      role="presentation"
    >
      <span className="flex items-center gap-1 max-w-full min-w-0" aria-label={t('appTitle')}>
        <span className="text-sm shrink-0" aria-hidden>
          📖
        </span>
        <span className="text-[11px] xs:text-xs font-semibold text-[#1B64F2] truncate">
          {t('appTitle')}
        </span>
      </span>
    </div>
  );
}
