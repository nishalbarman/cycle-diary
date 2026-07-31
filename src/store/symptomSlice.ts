// src/store/symptomSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SymptomEntry {
  id: string; // unique identifier
  date: string; // ISO date string
  symptom: string;
  severity: number; // e.g., 1-5
  notes?: string;
}

export interface SymptomState {
  entries: SymptomEntry[];
}

const initialState: SymptomState = {
  entries: [],
};

const symptomSlice = createSlice({
  name: 'symptom',
  initialState,
  reducers: {
    addSymptom(state, action: PayloadAction<SymptomEntry>) {
      state.entries.push(action.payload);
    },
    updateSymptom(state, action: PayloadAction<SymptomEntry>) {
      const index = state.entries.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
    },
    removeSymptom(state, action: PayloadAction<string>) {
      state.entries = state.entries.filter((e) => e.id !== action.payload);
    },
    clearSymptoms(state) {
      state.entries = [];
    },
  },
});

export const { addSymptom, updateSymptom, removeSymptom, clearSymptoms } = symptomSlice.actions;

export const selectSymptoms = (state: any) => state.symptom.entries;

export default symptomSlice.reducer;
