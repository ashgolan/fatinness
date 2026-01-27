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
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          backgroundColor: "#fbd555",
        }}
      >
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
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#fbd555",

            transform: {
              xs: "scale(1.35)",
              sm: "scale(1.22)",
              md: "scale(1.12)",
              lg: "scale(1.05)",
            },

            transition: "transform 0.4s ease",
            display: "block",
          }}
        />


      </Box>

      {/* شعار المطوّر يظهر بعد انتهاء الفيديو */}
      {showLogo && (
        <Box
          sx={{
            position: "absolute",
            bottom: "9%", // كان 8% — الآن أكثر تحت بـ 2 سم تقريبًا
            left: "50%",
            transform: "translateX(-50%)",
            opacity: showLogo ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
            textAlign: "center",
          }}
        >
          {/* نص تحت الشعار (اختياري) */}

          <div
            style={{
              marginTop: 6,
              fontSize: "0.75rem",
              color: "rgba(0,0,0,0.5)",
            }}
          >
            {t("common.developedBy")}
          </div>
        </Box>
      )}
    </Box>
  );
}
