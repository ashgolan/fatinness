// client/src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography } from "@mui/material";

export default function Splash() {
  const navigate = useNavigate();

  // ⏱️ الانتقال بعد 3 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  // 🎨 ألوان مستوحاة من اللوغو
  const COLORS = {
    background: "#FFD84D", // أصفر ذهبي
    gradientEnd: "#FFE77A",
    primary: "#9C1C6B", // خمري بنفسجي
    glow: "#D2418B", // وردي متوهج خفيف
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.gradientEnd} 100%)`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 🔮 دوائر النبض المتوهجة */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0.6 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* 🎯 الشعار */}
      <AnimatePresence>
        <motion.img
          key="logo"
          src="/uploads/logo.png" // ضع المسار الصحيح للوغو هنا
          alt="Fateness Logo"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{
            width: "180px",
            height: "180px",
            objectFit: "contain",
            zIndex: 2,
          }}
        />
      </AnimatePresence>

      {/* 🩰 نص العنوان والشعار */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 1 }}
        style={{ zIndex: 3 }}
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
    </Box>
  );
}
