import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  addWeightPoint,
  getWeightHistory,
  updateFcmToken,
  transferFcmOwnership,
  
} from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getUserProfile);
router.put("/me", updateUserProfile);
router.get("/me/weight-history", authMiddleware, getWeightHistory);
router.post("/me/weight", authMiddleware, addWeightPoint);
router.post("/fcm", updateFcmToken);

router.post("/fcm/transfer", authMiddleware, transferFcmOwnership);

export default router;
