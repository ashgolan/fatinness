import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: String, // اختياري
  },
  { timestamps: true }
);

export default mongoose.model("GalleryImage", galleryImageSchema);
