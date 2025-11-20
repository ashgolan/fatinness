// client/src/i18n/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./ar.json";
import he from "./he.json";
import en from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: ar,
        server: ar.server, // ⭐ إضافة namespace server
      },
      he: {
        translation: he,
        server: he.server,
      },
      en: {
        translation: en,
        server: en.server,
      },
    },

    // ⭐ تعريف الـ namespaces
    ns: ["translation", "server"], 
    defaultNS: "translation",

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
