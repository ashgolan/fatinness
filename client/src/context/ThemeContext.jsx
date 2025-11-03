import React, { createContext, useState, useMemo, useContext } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

// 🎨 ألوان العلامة الموحدة
const BRAND = {
  purple: "#A01860",
  purpleDark: "#7e0f4a",
  gold: "#FBC02D",
  goldDark: "#D8A410",
  bgDarkTop: "#0D0D0F",
  bgDarkBottom: "#16161A",
  paperDark: "#121319",
  lineDark: "#242735",
  textDark: "#EAEAEA",
  subDark: "#A0A6B8",
};

const ThemeModeContext = createContext();

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(
    localStorage.getItem("themeMode") || "light"
  );

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        direction: "rtl",
        palette: {
          mode,
          primary: { main: BRAND.purple },
          secondary: { main: BRAND.gold },
          background: {
            default: mode === "dark" ? BRAND.bgDarkTop : "#FCFAFF",
            paper: mode === "dark" ? BRAND.paperDark : "#FFFFFF",
          },
          text: {
            primary: mode === "dark" ? BRAND.textDark : "#1A1A1A",
            secondary: mode === "dark" ? BRAND.subDark : "#6B7280",
          },
          divider: mode === "dark" ? BRAND.lineDark : "#E6E9EF",
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily:
            'Cairo, "Noto Kufi Arabic", "Tajawal", Inter, system-ui, -apple-system',
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, BRAND }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
