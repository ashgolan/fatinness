// client/src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

export default function Splash() {
  const navigate = useNavigate();

  // ⏱️ الانتقال بعد 3 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        position: "fixed",     // يغطي الشاشة كاملة
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,          // فوق كل شيء
        overflow: "hidden",
      }}
    >
      {/* 🎥 فيديو الخلفية فقط */}
      <video
        src="/videos/splash1.mp4"
        autoPlay
        muted
        playsInline
        loop
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",  // يملأ الشاشة بالكامل
          top: 0,
          left: 0,
        }}
      />
    </Box>
  );
}
