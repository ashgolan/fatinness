import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Api } from "../api/Api";
import { useThemeMode } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const { mode, BRAND } = useThemeMode();
  const { t } = useTranslation();

  // ==========================
  // جلب صور الألبوم من السيرفر
  // ==========================
  useEffect(() => {
    Api.get("/gallery")
      .then((res) => setImages(res.data))
      .finally(() => setLoading(false));
  }, []);

  const openImage = (url) => {
    setSelectedImg(url);
    setOpen(true);
  };

  const closeImage = () => {
    setOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress sx={{ color: BRAND.purple }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* ====================== */}
      {/*         العنوان        */}
      {/* ====================== */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 3,
          textAlign: "center",
          background: `linear-gradient(90deg, ${mode === "dark" ? BRAND.gold : BRAND.purple
            }, ${mode === "dark" ? BRAND.purple : BRAND.gold})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {t("gallery.title")}
      </Typography>

      {/* في حالة عدم وجود صور */}
      {images.length === 0 && (
        <Typography
          sx={{
            textAlign: "center",
            mt: 4,
            color: mode === "dark" ? "#aaa" : "#555",
            fontSize: "1.1rem",
          }}
        >
          {t("gallery.empty")}
        </Typography>
      )}

      {/* ====================== */}
      {/*        GRID            */}
      {/* ====================== */}
      <Box
        sx={{
          columnCount: { xs: 2, sm: 3, md: 4 },
          columnGap: "6px",
        }}
      >
        {images.map((img) => (
          <Box
            key={img._id}
            sx={{
              mb: "6px",
              breakInside: "avoid",
              cursor: "pointer",
              overflow: "hidden",
              borderRadius: "10px",
              transition: "transform 0.25s ease, opacity 0.25s ease",
              "&:hover": {
                transform: "scale(1.03)",
                opacity: 0.9,
              },
            }}
            onClick={() => openImage(img.url)}
          >
            <img
              src={img.url}
              alt="Gallery"
              style={{
                width: "100%",
                display: "block",
                borderRadius: "10px",
              }}
            />
          </Box>
        ))}
      </Box>

      {/* ====================== */}
      {/*     Lightbox Viewer    */}
      {/* ====================== */}
      <Dialog
        open={open}
        onClose={closeImage}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",   // 👈 أضف هنا
            boxShadow: "none",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* زر الإغلاق */}
          <IconButton
            onClick={closeImage}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "#fff",
              zIndex: 10,
            }}
          >
            <CloseIcon sx={{ fontSize: 32 }} />
          </IconButton>

          {/* الصورة المكبرة */}
          {/* الصورة المكبرة */}
          <Box
            sx={{
              background:
                mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))"
                  : "rgba(255,255,255,0.95)",
              px: 0.3,   // 👈 جانبي أقل
              py: 0.3,   // 👈 الأعلى والأسفل يبقى جميل
              borderRadius: "14px",
              boxShadow:
                mode === "dark"
                  ? `0 0 40px ${BRAND.gold}33`
                  : `0 0 30px ${BRAND.purple}33`,
              border: `2px solid ${mode === "dark" ? BRAND.gold : BRAND.purple
                }55`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={selectedImg}
              alt="Preview"
              style={{
                width: "100%",
                maxWidth: "900px",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          </Box>

        </DialogContent>
      </Dialog>
    </Box>
  );
}
