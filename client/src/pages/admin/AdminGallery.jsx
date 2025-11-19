import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  ImageList,
  ImageListItem,
  CircularProgress,
} from "@mui/material";
import { uploadBrandImage } from "../../firebase/uploadImage";
import { Api } from "../../api/Api";
import DeleteIcon from "@mui/icons-material/Delete";

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await Api.get("/gallery");
    setImages(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    // رفع الصورة لفirebase
    const url = await uploadBrandImage(file, "gallery");

    // حفظها في السيرفر
    await Api.post("/gallery", { url });

    setUploading(false);
    load();
  };

  const deleteImg = async (id) => {
    await Api.delete(`/gallery/${id}`);
    load();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="contained" component="label">
        رفع صورة جديدة
        <input hidden type="file" accept="image/*" onChange={handleUpload} />
      </Button>

      {uploading && <CircularProgress sx={{ ml: 2 }} />}

      <ImageList variant="masonry" cols={3} gap={10} sx={{ mt: 3 }}>
        {images.map((img) => (
          <ImageListItem key={img._id}>
            <img src={img.url} alt="" style={{ borderRadius: 8 }} />

            <Button
              color="error"
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={() => deleteImg(img._id)}
              sx={{ mt: 1 }}
            >
              حذف
            </Button>
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  );
}
