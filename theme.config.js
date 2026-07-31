// theme.config.js
// Change ACTIVE_THEME to 'green' or 'pink'
// To revert to classic pink: set ACTIVE_THEME = 'pink'
const ACTIVE_THEME = "green";

const themes = {
  pink: {
    name: "Classic Pink",
    primary: "#ec4899",
    primaryDark: "#db2777",
    primaryLight: "#fce7f3",
    ringTrack: "#fbcfe8",
    gradientHeader: ["#fdf2f8", "#fce7f3", "#fbcfe8"],
    pink: {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f472b6",
      400: "#f43f5e",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
    },
  },
  green: {
    name: "Emerald Green",
    primary: "#059669",
    primaryDark: "#047857",
    primaryLight: "#ecfdf5",
    ringTrack: "#a7f3d0",
    gradientHeader: ["#ecfdf5", "#d1fae5", "#a7f3d0"],
    pink: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#059669",
      600: "#047857",
      700: "#065f46",
      800: "#064e3b",
      900: "#022c22",
    },
  },
};

const currentTheme = themes[ACTIVE_THEME] || themes.pink;

module.exports = {
  ACTIVE_THEME,
  currentTheme,
  themes,
};
