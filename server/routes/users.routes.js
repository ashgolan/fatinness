import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  addWeightPoint,
  getWeightHistory,
  updateFcmToken,
} from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getUserProfile);
router.put("/me", updateUserProfile);
router.get("/weight-history", getWeightHistory);
router.post("/weight", addWeightPoint);
router.post("/fcm", updateFcmToken);

export default router;
