// src/store/hooks.ts
// Typed hooks for Redux — replaces Zustand selectors throughout the app
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/** Typed dispatch hook */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector hook */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
