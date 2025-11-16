// client/src/context/DirectionContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DirectionContext = createContext();

export function DirectionProvider({ children }) {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState("ltr");

  useEffect(() => {
    if (i18n.language === "ar" || i18n.language === "he") {
      setDirection("rtl");
      document.documentElement.dir = "rtl";
    } else {
      setDirection("ltr");
      document.documentElement.dir = "ltr";
    }
  }, [i18n.language]);

  return (
    <DirectionContext.Provider value={{ direction }}>
      {children}
    </DirectionContext.Provider>
  );
}

export const useDirection = () => useContext(DirectionContext);
