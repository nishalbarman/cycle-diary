import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "@/shared/types";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutFirebase,
  onAuthStateChanged,
} from "@/shared/services/firebase";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setError: (err: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      error: null,
      initialized: false,

      setUser: (user) => set({ user, isLoading: false, error: null }),
      setError: (error) => set({ error, isLoading: false }),

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await signInWithEmail(email, password);
        } catch (e: any) {
          set({ error: e?.message ?? "Sign in failed", isLoading: false });
          throw e;
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          await signUpWithEmail(email, password, name);
        } catch (e: any) {
          set({ error: e?.message ?? "Sign up failed", isLoading: false });
          throw e;
        }
      },

      signInGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          await signInWithGoogle();
        } catch (e: any) {
          set({ error: e?.message ?? "Google sign in failed", isLoading: false });
          throw e;
        }
      },

      signOut: async () => {
        try {
          await signOutFirebase();
        } finally {
          set({ user: null, isLoading: false, error: null });
        }
      },

      init: () => {
        const unsub = onAuthStateChanged((user) => {
          set({ user, isLoading: false, initialized: true, error: null });
        });
        return unsub;
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
