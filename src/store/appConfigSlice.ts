import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppConfigState {
  versionCode: number;
  forceUpdate: boolean;
  fetchedActivated: boolean;
}

const initialState: AppConfigState = {
  versionCode: 0,
  forceUpdate: false,
  fetchedActivated: false,
};

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    updateAppConfig(state, action: PayloadAction<Partial<AppConfigState>>) {
      return { ...state, ...action.payload };
    },
    resetAppConfig() {
      return initialState;
    },
  },
});

export const { updateAppConfig, resetAppConfig } = appConfigSlice.actions;
export const selectAppConfig = (state: any): AppConfigState => state.appConfig;
export default appConfigSlice.reducer;
