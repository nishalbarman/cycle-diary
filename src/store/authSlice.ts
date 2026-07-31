// src/store/authSlice.ts
// Migrated from src/shared/store/authStore.ts (Zustand) → Redux Toolkit slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '@/shared/types';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutFirebase,
  onAuthStateChanged,
} from '@/shared/services/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  initialized: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────────────────────────
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Sign in failed');
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    { email, password, name }: { email: string; password: string; name?: string },
    { rejectWithValue }
  ) => {
    try {
      await signUpWithEmail(email, password, name);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Sign up failed');
    }
  }
);

export const signInGoogle = createAsyncThunk(
  'auth/signInGoogle',
  async (_, { rejectWithValue }) => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Google sign in failed');
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await signOutFirebase();
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Sign out failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isLoading = false;
      state.initialized = true;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.isLoading = false;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    setInitialized(state) {
      state.initialized = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // signIn
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signIn.fulfilled, (state) => {
        state.isLoading = false;
      });

    // signUp
    builder
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signUp.fulfilled, (state) => {
        state.isLoading = false;
      });

    // signInGoogle
    builder
      .addCase(signInGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signInGoogle.fulfilled, (state) => {
        state.isLoading = false;
      });

    // signOut
    builder
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state) => {
        // Still clear user even if server sign-out failed
        state.user = null;
        state.isLoading = false;
      });
  },
});

export const { setUser, clearUser, setError, setInitialized } = authSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectUser = (state: any) => state.auth.user;
export const selectAuthIsLoading = (state: any) => state.auth.isLoading;
export const selectAuthError = (state: any) => state.auth.error;
export const selectAuthInitialized = (state: any) => state.auth.initialized;

// ─────────────────────────────────────────────────────────────────────────────
// Auth listener initializer (call once in _layout.tsx)
// Returns the unsubscribe function from onAuthStateChanged
// ─────────────────────────────────────────────────────────────────────────────
export function initAuthListener(dispatch: any): () => void {
  return onAuthStateChanged((user) => {
    dispatch(setUser(user));
  });
}

export default authSlice.reducer;
