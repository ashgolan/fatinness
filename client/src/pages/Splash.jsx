// client/src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import i18n from "../i18n/i18n";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1️⃣ اقرأ اللغة من التخزين إن وُجدت
    let lang = localStorage.getItem("appLanguage");

    // 2️⃣ إذا لا يوجد → استخدم لغة الجهاز وحدد ar / he / en
    if (!lang) {
      const browserLang = navigator.language || navigator.userLanguage || "en";

      if (browserLang.startsWith("ar")) lang = "ar";
      else if (browserLang.startsWith("he")) lang = "he";
      else lang = "en";

      localStorage.setItem("appLanguage", lang);
    }

    // 3️⃣ طبّق اللغة في i18next
    i18n.changeLanguage(lang);

    // 4️⃣ بعد 4 ثواني (مدة الفيديو تقريباً) → انتقال إلى صفحة الدخول
    const timer = setTimeout(() => {
      navigate("/login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 1.25; // من 5 ثواني إلى 4 ثواني
          }}
        />
      </Box>

      {/* 🔻 هنا كان يوجد Stack + Buttons لاختيار اللغة
          تم حذفه بناءً على طلبك:
          الآن اللغة تُحدد تلقائياً من الجهاز / localStorage
      */}
    </Box>
  );
}
