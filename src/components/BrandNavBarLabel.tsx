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
      className={`flex justify-center items-center min-h-[28px] px-3 py-0.5 bg-[#f8fafc] ${edge}`}
      role="presentation"
    >
      <span className="size-8 shrink-0 rounded-md shadow-sm ring-1 ring-[#E6EAF2] bg-white flex items-center justify-center p-[3px] box-border">
        <img
          src={BRAND_LOGO_SRC}
          alt={t('appTitle')}
          width={64}
          height={64}
          className="h-full w-full object-contain"
          decoding="async"
        />
      </span>
    </div>
  );
}
