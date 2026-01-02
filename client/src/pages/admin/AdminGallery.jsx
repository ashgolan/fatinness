import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  ImageList,
  ImageListItem,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { uploadBrandImage } from "../../firebase/uploadImage";
import { Api } from "../../api/Api";
import { useTranslation } from "react-i18next";
import useServerError from "../../hooks/useServerError";

export default function AdminGallery() {
  const { t } = useTranslation();
  const handleServerError = useServerError();

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const { data } = await Api.get("/gallery");
      setImages(data);
    } catch (err) {
      handleServerError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (images.length >= 10) {
      handleServerError({
        response: {
          data: { code: "MAX_GALLERY_IMAGES" },
        },
      });
      return;
    }

    setUploading(true);

    try {
      const url = await uploadBrandImage(file, "gallery");
      await Api.post("/gallery", { url });
      load();
    } catch (err) {
      handleServerError(err);
    } finally {
      setUploading(false);
    }
  };

  const deleteImg = async (id) => {
    const confirmed = window.confirm(
      t("adminSettings.gallery.confirmDelete")
    );
    if (!confirmed) return;

    try {
      await Api.delete(`/gallery/${id}`);
      load();
    } catch (err) {
      handleServerError(err);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="contained" component="label">
        {t("adminSettings.gallery.addImage")}
        <input hidden type="file" accept="image/*" onChange={handleUpload} />
      </Button>

      {uploading && <CircularProgress sx={{ ml: 2 }} />}

      <ImageList variant="masonry" cols={3} gap={10} sx={{ mt: 3 }}>
        {images.map((img) => (
          <ImageListItem key={img._id}>
            <img
              src={img.url}
              alt=""
              style={{ borderRadius: 8, width: "100%" }}
            />

            <Button
              color="error"
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={() => deleteImg(img._id)}
              sx={{ mt: 1 }}
            >
              {t("adminNotifications.delete")}
            </Button>
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  );
}
