import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdFreeState {
  isAdFree: boolean;
  adFreeStartTime: number | null;
  adFreeUnlockTime: number;
  isFetchedAndActivated: boolean;

  startAdFree: () => void;
  setAdFreeUnlockTime: (hours: number) => void;
  checkAdFreeStatus: () => void;
  setFetchedAndActivated: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_HOURS = 5;
const HOUR_MS = 60 * 60 * 1000;

const initial: Omit<
  AdFreeState,
  | "startAdFree"
  | "setAdFreeUnlockTime"
  | "checkAdFreeStatus"
  | "setFetchedAndActivated"
  | "reset"
> = {
  isAdFree: false,
  adFreeStartTime: null,
  adFreeUnlockTime: DEFAULT_HOURS,
  isFetchedAndActivated: false,
};

export const useAdFreeStore = create<AdFreeState>()(
  persist(
    (set, get) => ({
      ...initial,
      startAdFree: () => {
        set({ isAdFree: true, adFreeStartTime: Date.now() });
      },
      setAdFreeUnlockTime: (hours) => set({ adFreeUnlockTime: hours }),
      checkAdFreeStatus: () => {
        const { isAdFree, adFreeStartTime, adFreeUnlockTime } = get();
        if (!isAdFree || !adFreeStartTime) return;
        const elapsed = Date.now() - adFreeStartTime;
        const windowMs = adFreeUnlockTime * HOUR_MS;
        if (elapsed >= windowMs) {
          set({ isAdFree: false, adFreeStartTime: null });
        }
      },
      setFetchedAndActivated: (v) => set({ isFetchedAndActivated: v }),
      reset: () => set(initial),
    }),
    {
      name: "ads.adFree",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAdFree: state.isAdFree,
        adFreeStartTime: state.adFreeStartTime,
        adFreeUnlockTime: state.adFreeUnlockTime,
      }),
    },
  ),
);

export const getAdFreeRemainingMs = (state: AdFreeState): number => {
  if (!state.isAdFree || !state.adFreeStartTime) return 0;
  const elapsed = Date.now() - state.adFreeStartTime;
  const windowMs = state.adFreeUnlockTime * HOUR_MS;
  return Math.max(0, windowMs - elapsed);
};
