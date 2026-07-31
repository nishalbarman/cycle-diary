// src/shared/hooks/useSync.ts
// Migrated from Zustand useAuthStore + usePeriodStore → Redux selectors + dispatch
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, selectAuthInitialized } from '@/store/authSlice';
import { setSyncUid, setSyncStatus, rehydrateAfterSync } from '@/store/logSlice';
import { hydrateSettings } from '@/store/settingsSlice';
import {
  pullFromFirestore,
  subscribeToFirestore,
  unsubscribeFromFirestore,
  setSyncStatusListener,
} from '@/shared/services/sync';
import type { SyncStatus } from '@/shared/services/sync';

export function useSync() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const initialized = useAppSelector(selectAuthInitialized);
  const didInitialPull = useRef(false);

  // Register sync status listener once
  useEffect(() => {
    setSyncStatusListener((status: SyncStatus) => {
      dispatch(setSyncStatus(status));
      // After sync writes to SQLite, re-hydrate Redux state
      if (status === 'idle') {
        dispatch(rehydrateAfterSync());
        dispatch(hydrateSettings());
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (!initialized) return;

    if (user) {
      dispatch(setSyncUid(user.uid));

      if (!didInitialPull.current) {
        didInitialPull.current = true;
        pullFromFirestore(user.uid)
          .then(() => {
            // Re-hydrate Redux after initial pull
            dispatch(rehydrateAfterSync());
            dispatch(hydrateSettings());
          })
          .catch((e) => {
            if (__DEV__) console.warn('[sync] initial pull failed:', e);
          });
      }

      const unsub = subscribeToFirestore(user.uid);
      return () => {
        unsub();
      };
    } else {
      didInitialPull.current = false;
      unsubscribeFromFirestore();
      dispatch(setSyncUid(null));
    }
  }, [user?.uid, initialized, dispatch]);
}
