// src/shared/theme/index.ts
// Imports active theme from theme.config.js
const { ACTIVE_THEME, currentTheme, themes } = require("../../../theme.config");

export interface ThemePalette {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  ringTrack: string;
  gradientHeader: string[];
  pink: Record<number, string>;
}

export const activeThemeName: "green" | "pink" = ACTIVE_THEME;
export const theme: ThemePalette = currentTheme;
export const allThemes = themes;
export default theme;
