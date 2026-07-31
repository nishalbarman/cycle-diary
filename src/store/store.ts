// src/store/store.ts
// Main Redux store — consolidates all slices and configures redux-persist
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Slices
import logReducer from './logSlice';
import settingsReducer from './settingsSlice';
import periodReducer from './periodSlice';
import symptomReducer from './symptomSlice';
import authReducer from './authSlice';
import adConfigReducer from './adConfigSlice';
import adActivityReducer from './adActivitySlice';
import adFreeReducer from './adFreeSlice';
import appConfigReducer from './appConfigSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Persist configs
// Period logs and settings are stored in SQLite — no AsyncStorage persist needed.
// Only auth, ad config, ad activity, and ad-free state need AsyncStorage persist.
// ─────────────────────────────────────────────────────────────────────────────
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user'], // only persist the user object
};

const adConfigPersistConfig = {
  key: 'adConfig',
  storage: AsyncStorage,
  blacklist: ['fetchedActivated'], // don't persist ephemeral fetch flag
};

const adActivityPersistConfig = {
  key: 'adActivity',
  storage: AsyncStorage,
  blacklist: [], // persist all ad activity
};

const adFreePersistConfig = {
  key: 'adFree',
  storage: AsyncStorage,
  blacklist: ['isFetchedAndActivated'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Root reducer
// ─────────────────────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  // Auth — persisted (user object)
  auth: persistReducer(authPersistConfig, authReducer),

  // Period data — backed by SQLite, NOT persisted to AsyncStorage
  log: logReducer,
  settings: settingsReducer,
  period: periodReducer,
  symptom: symptomReducer,

  // App & Version Config
  appConfig: appConfigReducer,

  // Ads — persisted to AsyncStorage
  adConfig: persistReducer(adConfigPersistConfig, adConfigReducer),
  adActivity: persistReducer(adActivityPersistConfig, adActivityReducer),
  adFree: persistReducer(adFreePersistConfig, adFreeReducer),
});

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
