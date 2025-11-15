// client/src/pages/Splash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import i18n from "../i18n/i18n";

export default function Splash() {
  const navigate = useNavigate();
  const [showButtons, setShowButtons] = useState(false);

  // ⏱️ بعد 5 ثوانٍ: أظهر أزرار اختيار اللغة
  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 5000);
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
        overflow: "hidden",
        background: "#F7D34B",
        zIndex: 9999,
      }}
    >
      {/* الفيديو داخل إطار */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60%",
          height: "60%",
          overflow: "hidden",
          borderRadius: "20px",
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
        />
      </Box>

      {/* ازرار اختيار اللغة */}
      {showButtons && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
        <Button
  variant="outlined"
  sx={{
    backgroundColor: "white",
    color: "#9C1C6B",
    borderColor: "#9C1C6B",
    fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#ffffff",
      borderColor: "#7a1554",
      boxShadow: "0 0 10px rgba(156, 28, 107, 0.25)",
    },
  }}
  onClick={() => chooseLanguage("ar")}
>
  العربية
</Button>

<Button
  variant="outlined"
  sx={{
    backgroundColor: "white",
    color: "#9C1C6B",
    borderColor: "#9C1C6B",
    fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#ffffff",
      borderColor: "#7a1554",
      boxShadow: "0 0 10px rgba(156, 28, 107, 0.25)",
    },
  }}
  onClick={() => chooseLanguage("he")}
>
  עברית
</Button>

<Button
  variant="outlined"
  sx={{
    backgroundColor: "white",
    color: "#9C1C6B",
    borderColor: "#9C1C6B",
    fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#ffffff",
      borderColor: "#7a1554",
      boxShadow: "0 0 10px rgba(156, 28, 107, 0.25)",
    },
  }}
  onClick={() => chooseLanguage("en")}
>
  English
</Button>

        </Stack>
      )}
    </Box>
  );
}
