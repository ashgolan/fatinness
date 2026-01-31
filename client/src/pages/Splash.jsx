// client/src/pages/Splash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import i18n from "../i18n/i18n";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [fadeOut, setFadeOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    let lang = localStorage.getItem("appLanguage");

    if (!lang) {
      const browserLang = navigator.language || navigator.userLanguage || "en";
      if (browserLang.startsWith("ar")) lang = "ar";
      else if (browserLang.startsWith("he")) lang = "he";
      else lang = "en";

      localStorage.setItem("appLanguage", lang);
    }

    i18n.changeLanguage(lang);
  }, []);

  // -------------------------------
  // 🚀 عند انتهاء الفيديو
  // -------------------------------
  const handleVideoEnd = () => {
    // 1) ظهور الشعار
    setShowLogo(true);

    // 2) بعد 1 ثانية → FadeOut
    setTimeout(() => {
      setFadeOut(true);
    }, 1000);

    // 3) بعد 1.6 ثانية → الانتقال للوجين
    setTimeout(() => {
      navigate("/login");
    }, 1600);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#fbd555",
        overflow: "hidden",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease-in-out",
      }}
    >
      {/* الفيديو */}
      <Box
        component="video"
        src="/videos/splash1.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onLoadedMetadata={(e) => {
          e.target.playbackRate = 1.25;
        }}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",

          width: {
            xs: "95%",
            sm: "85%",
            md: "65%",
            lg: "45%",
          },
          maxWidth: 520,
          aspectRatio: "9 / 16",

          borderRadius: "22px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          backgroundColor: "#fbd555",

          objectFit: "contain",

          // ❗ مهم جدًا
          display: "block",
        }}
      />

      {showLogo && (
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 10, sm: 14 },
            left: "50%",
            transform: "translateX(-50%)",

            px: 1.6,
            py: 0.6,
            borderRadius: "16px",

            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",

            fontSize: { xs: "0.65rem", sm: "0.7rem" },
            fontWeight: 600,
            letterSpacing: "0.3px",
            color: "#fff",

            opacity: 1,
            transition: "opacity 0.6s ease",
            pointerEvents: "none",
            zIndex: 5,
            whiteSpace: "nowrap",
          }}
        >
          {t("common.developedBy")}
        </Box>
      )}

    </Box>
  );
}
