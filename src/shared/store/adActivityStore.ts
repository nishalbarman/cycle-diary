import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAdConfigStore } from "./adConfigStore";

export type ScreenKey = "home" | "calendar" | "history" | "profile" | "settings" | "ad_free_unlock" | "action";

export interface AdActivityState {
  lastAdShownTime: {
    anyAdLastShownTime: number | null;
    interstitial: Record<ScreenKey, number | null>;
    rewarded: Record<ScreenKey, number | null>;
    appOpen: number | null;
  };
  totalAdClickCount: number;
  frequentAdClickCount: number;
  lastClickTimestamp: number | null;
  totalAdClickCountToday: number;
  lastClickDate: string | null;
  isUserBlocked: boolean;

  setLastInterstitialShown: (screen: ScreenKey, time?: number) => void;
  setLastRewardedShown: (screen: ScreenKey, time?: number) => void;
  setAnyAdLastShownTime: (time: number) => void;
  setAppOpenLastShown: (time: number) => void;
  trackFrequentAdClick: () => void;
  trackDailyAdClick: () => void;
  reset: () => void;
}

const initial: Omit<
  AdActivityState,
  | "setLastInterstitialShown"
  | "setLastRewardedShown"
  | "setAnyAdLastShownTime"
  | "setAppOpenLastShown"
  | "trackFrequentAdClick"
  | "trackDailyAdClick"
  | "reset"
> = {
  lastAdShownTime: {
    anyAdLastShownTime: null,
    interstitial: {
      home: null,
      calendar: null,
      history: null,
      profile: null,
      settings: null,
      ad_free_unlock: null,
      action: null,
    },
    rewarded: {
      home: null,
      calendar: null,
      history: null,
      profile: null,
      settings: null,
      ad_free_unlock: null,
      action: null,
    },
    appOpen: null,
  },
  totalAdClickCount: 0,
  frequentAdClickCount: 0,
  lastClickTimestamp: null,
  totalAdClickCountToday: 0,
  lastClickDate: null,
  isUserBlocked: false,
};

const today = () => new Date().toISOString().slice(0, 10);

export const useAdActivityStore = create<AdActivityState>()(
  persist(
    (set, get) => ({
      ...initial,
      setLastInterstitialShown: (screen, time = Date.now()) =>
        set((s) => ({
          lastAdShownTime: {
            ...s.lastAdShownTime,
            interstitial: { ...s.lastAdShownTime.interstitial, [screen]: time },
          },
        })),
      setLastRewardedShown: (screen, time = Date.now()) =>
        set((s) => ({
          lastAdShownTime: {
            ...s.lastAdShownTime,
            rewarded: { ...s.lastAdShownTime.rewarded, [screen]: time },
          },
        })),
      setAnyAdLastShownTime: (time) =>
        set((s) => ({
          lastAdShownTime: { ...s.lastAdShownTime, anyAdLastShownTime: time },
        })),
      setAppOpenLastShown: (time) =>
        set((s) => ({
          lastAdShownTime: { ...s.lastAdShownTime, appOpen: time },
        })),
      trackFrequentAdClick: () => {
        const { frequentInterval, maximumAllowedFrequentClicks } =
          useAdConfigStore.getState();
        const now = Date.now();
        set((s) => {
          if (
            s.lastClickTimestamp &&
            now - s.lastClickTimestamp <= frequentInterval
          ) {
            const next = s.frequentAdClickCount + 1;
            if (next > maximumAllowedFrequentClicks) {
              if (__DEV__) {
                console.warn(
                  "[ads] User exceeded max frequent ad clicks. Block ads.",
                );
              }
            }
            return {
              frequentAdClickCount: next,
              lastClickTimestamp: now,
              totalAdClickCount: s.totalAdClickCount + 1,
            };
          }
          return {
            frequentAdClickCount: 1,
            lastClickTimestamp: now,
            totalAdClickCount: s.totalAdClickCount + 1,
          };
        });
      },
      trackDailyAdClick: () => {
        const s = get();
        if (s.isUserBlocked) return;
        const t = today();
        const baseCount = s.lastClickDate === t ? s.totalAdClickCountToday : 0;
        const next = baseCount + 1;
        const threshold = useAdConfigStore.getState().dailyClickBlockThreshold;
        set({
          lastClickDate: t,
          totalAdClickCountToday: next,
          isUserBlocked: next > threshold,
        });
        if (next > threshold && __DEV__) {
          console.warn(
            "[ads] Daily click threshold exceeded. User permanently blocked from ads.",
          );
        }
      },
      reset: () => set(initial),
    }),
    {
      name: "ads.activity",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastAdShownTime: state.lastAdShownTime,
        totalAdClickCount: state.totalAdClickCount,
        frequentAdClickCount: state.frequentAdClickCount,
        lastClickTimestamp: state.lastClickTimestamp,
        totalAdClickCountToday: state.totalAdClickCountToday,
        lastClickDate: state.lastClickDate,
        isUserBlocked: state.isUserBlocked,
      }),
    },
  ),
);
