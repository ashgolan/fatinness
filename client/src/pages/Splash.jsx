// client/src/pages/Splash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import i18n from "../i18n/i18n";

export default function Splash() {
  const navigate = useNavigate();
  const [showButtons, setShowButtons] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false); // 👈 جديد

  // يظهر بعد 4 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const chooseLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("appLanguage", lang);
    navigate("/login");
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
          id="splashVideo"
          src="/videos/splash1.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlay={() => setVideoVisible(true)} // 👈 إظهار الفيديو فور التشغيل
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 1.25;
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: videoVisible ? 1 : 0, // 👈 إخفاء كامل حتى يبدأ التشغيل
            transition: "opacity 0.4s ease-in-out",
            backgroundColor: "transparent",
          }}
        />
      </Box>

      {/* أزرار اختيار اللغة */}
      {showButtons && (
        <Stack
          direction="row"
          spacing={3}
          sx={{
            position: "absolute",
            bottom: "25px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {[
            { label: "العربية", code: "ar" },
            { label: "עברית", code: "he" },
            { label: "English", code: "en" },
          ].map((btn) => (
            <Button
              key={btn.code}
              variant="outlined"
              onClick={() => chooseLanguage(btn.code)}
              sx={{
                paddingX: "30px",
                paddingY: "10px",
                borderRadius: "30px",
                fontWeight: "bold",
                fontSize: "15px",
                textTransform: "none",
                color: "#9C1C6B",
                borderColor: "#9C1C6B",
                backgroundColor: "white",
                transition: "0.25s ease-in-out",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",

                "&:hover": {
                  backgroundColor: "#9C1C6B",
                  color: "white",
                  borderColor: "#7A1554",
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 20px rgba(156, 28, 107, 0.35)",
                },
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Stack>
      )}
    </Box>
  );
}
