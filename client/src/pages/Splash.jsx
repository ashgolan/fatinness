// client/src/pages/Splash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import i18n from "../i18n/i18n";

export default function Splash() {
  const navigate = useNavigate();

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
          width: "70%",
          height: "70%",
          overflow: "hidden",
          borderRadius: "22px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }}
      >
        <video
          src="/videos/splash1.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 1.25;
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
    
    <div style={{
      marginTop: 6,
      fontSize: "0.75rem",
      color: "rgba(0,0,0,0.5)"
    }}>
      Developed by A.Shaalan Tech
    </div>
    
  </Box>
)}
    </Box>
  );
}
