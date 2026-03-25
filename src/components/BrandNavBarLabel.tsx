import { useTranslation } from '../hooks/useTranslation';

/** 콘솔·스토어에 등록한 앱 로고( public/brand-logo.png ) */
const BRAND_LOGO_SRC = '/brand-logo.png';

/** 앱인토스 심사: 공통 내비/헤더에 브랜드 로고 노출 */
export function BrandNavBarLabel({ variant = 'nav' }: { variant?: 'nav' | 'header' }) {
  const { t } = useTranslation();
  const edge =
    variant === 'header' ? 'border-t border-[#E6EAF2]' : 'border-b border-[#E6EAF2]';

  return (
    <div
      className={`flex justify-center items-center min-h-[38px] px-3 py-1 bg-[#f8fafc] ${edge}`}
      role="presentation"
    >
      <span className="h-9 w-9 shrink-0 rounded-full overflow-hidden shadow-sm ring-1 ring-[#E6EAF2] bg-white block">
        <img
          src={BRAND_LOGO_SRC}
          alt={t('appTitle')}
          width={36}
          height={36}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </span>
    </div>
  );
}
