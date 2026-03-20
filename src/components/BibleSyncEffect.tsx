import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBibleStore } from '../store/bibleStore';
import { syncAllToSupabase } from '../services/supabaseSync';

const DEBOUNCE_MS = 2500;

export function BibleSyncEffect() {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const sync = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const s = useBibleStore.getState();
        try {
          await syncAllToSupabase(user.id, {
            memos: s.memos,
            bookmarks: s.bookmarks,
            dailyVerses: s.dailyVerses,
            completedDays: s.completedDays,
            startBookId: s.startBookId,
            customOrder: s.customOrder,
            currentDayIndex: s.currentDayIndex,
          });
        } catch {
          // 동기화 실패 시 무시 (네트워크 등)
        }
        timerRef.current = null;
      }, DEBOUNCE_MS);
    };

    const unsub = useBibleStore.subscribe(sync);

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  return null;
}
