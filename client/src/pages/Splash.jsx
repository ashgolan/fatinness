// client/src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography } from "@mui/material";

export default function Splash() {
  const navigate = useNavigate();

  // 🎬 الانتقال التلقائي بعد 3 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login"); // يمكنك تغييره إلى /dashboard إن أردت
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  // 🎨 ألوان مأخوذة من شعار Fateness
  const COLORS = {
    background: "#FFD84D", // أصفر ذهبي
    primary: "#9C1C6B", // خمري بنفسجي
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, #FFF4B7 100%)`,
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        <motion.img
          key="logo"
          src="/uploads/fatinness_logo.png" // ✅ ضع هنا مسار اللوغو (أو import مباشر)
          alt="Fateness Logo"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            objectFit: "contain",
          }}
        />

        <motion.div
          key="text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <Typography
            variant="h4"
            sx={{
              mt: 3,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "Cairo, sans-serif",
              textAlign: "center",
              letterSpacing: "2px",
            }}
          >
            F A T I N E S S
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              mt: 1,
              fontWeight: 500,
              color: "#7C184F",
              textAlign: "center",
              letterSpacing: "1.5px",
            }}
          >
            STRONGER EVERY DAY
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
