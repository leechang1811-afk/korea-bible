import { useEffect, useRef } from 'react';
import { useTossBanner } from '../hooks/useTossAds';

const BANNER_AD_GROUP_ID = 'ait.v2.live.63aaddbcfd854e96';

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, attachBanner } = useTossBanner();

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;

    const result = attachBanner(BANNER_AD_GROUP_ID, containerRef.current, {
      theme: 'light',
      tone: 'grey',
      variant: 'expanded',
      callbacks: {
        onAdFailedToRender: () => {
          // 앱 체감 성능 보호: 렌더 실패 시 조용히 종료
        },
        onNoFill: () => {
          // no-op
        },
      },
    });

    return () => {
      result?.destroy?.();
    };
  }, [isInitialized, attachBanner]);

  /* 높이 축소: 탭 바와 합쳐도 과도한 하단 점유 방지(광고 SDK가 허용하는 범위에서 조정) */
  return <div ref={containerRef} className="w-full shrink-0" style={{ width: '100%', height: 72 }} />;
}
