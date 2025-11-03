import express from "express";
import {
  toggleMaintenance,
  getMaintenanceStatus,
} from "../controllers/maintenance.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/toggle", authMiddleware, toggleMaintenance);
router.get("/status", getMaintenanceStatus);

export default router;
