// client/src/theme/theme.js
import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

export const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.danger },
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    text: {
      primary: colors.textDark,
      secondary: colors.textLight,
    },
  },
  typography: {
    fontFamily: '"Tajawal", "Cairo", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: "10px 20px",
          fontWeight: 600,
          boxShadow: `0 3px 6px ${colors.primary}40`,
          "&:hover": {
            backgroundColor: colors.primary,
            opacity: 0.9,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
          backgroundColor: colors.paper,
        },
      },
    },
  },
});
