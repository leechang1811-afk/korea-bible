import { useCallback, useEffect, useRef, useState } from 'react';

type TossAdsModule = typeof import('@apps-in-toss/web-framework');

let cachedModule: TossAdsModule | null = null;
let bannerInitState: 'idle' | 'pending' | 'ready' | 'failed' = 'idle';
let bannerInitPromise: Promise<boolean> | null = null;

async function getTossAds(): Promise<TossAdsModule | null> {
  if (cachedModule) return cachedModule;
  try {
    const mod = await import('@apps-in-toss/web-framework');
    cachedModule = mod;
    return mod;
  } catch {
    return null;
  }
}

async function ensureBannerInitialized(): Promise<boolean> {
  const mod = await getTossAds();
  if (!mod?.TossAds?.initialize?.isSupported?.()) return false;

  if (bannerInitState === 'ready') return true;
  if (bannerInitState === 'pending' && bannerInitPromise) return bannerInitPromise;

  bannerInitState = 'pending';
  bannerInitPromise = new Promise<boolean>((resolve) => {
    mod.TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          bannerInitState = 'ready';
          resolve(true);
        },
        onInitializationFailed: (err) => {
          const message = String((err as { message?: string })?.message ?? err ?? '');
          if (message.includes('Already initialized')) {
            bannerInitState = 'ready';
            resolve(true);
            return;
          }
          bannerInitState = 'failed';
          resolve(false);
        },
      },
    });
  });

  return bannerInitPromise;
}

export function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const modRef = useRef<TossAdsModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTossAds().then((mod) => {
      modRef.current = mod;
    });
    ensureBannerInitialized().then((ok) => {
      if (!cancelled && ok) setIsInitialized(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const attachBanner = useCallback(
    (
      adGroupId: string,
      element: HTMLElement,
      options?: Parameters<NonNullable<TossAdsModule['TossAds']>['attachBanner']>[2]
    ) => {
      const mod = modRef.current;
      if (!isInitialized || !mod?.TossAds?.attachBanner?.isSupported?.()) return null;
      return mod.TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized]
  );

  return { isInitialized, attachBanner };
}
