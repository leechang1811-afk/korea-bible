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

  return <div ref={containerRef} className="w-full shrink-0" style={{ width: '100%', height: 96 }} />;
}
