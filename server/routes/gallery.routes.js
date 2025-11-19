import express from "express";
import GalleryImage from "../models/GalleryImage.js";

// ⭐ الاستيراد الصحيح بناءً على كودك
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();

// 🟢 كل المستخدمين يمكنهم رؤية الصور
router.get("/", async (req, res) => {
  const images = await GalleryImage.find().sort({ createdAt: -1 });
  res.json(images);
});

// 🔵 رفع صورة – للمشرفة والمدير فقط
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ message: "الرابط مطلوب" });

  const img = await GalleryImage.create({ url, title });
  res.json(img);
});

// 🔴 حذف صورة – للأدمن أو المدير
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await GalleryImage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
