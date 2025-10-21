import express from "express";
import {
  createWeekTemplate,
  applyTemplate,
  setUserExtraBooking,
  exportAttendanceReport,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/templates", createWeekTemplate);
router.post("/templates/apply", applyTemplate);
router.put("/users/extra-booking", setUserExtraBooking);
router.get("/reports/attendance", exportAttendanceReport);
router.get("/dashboard", getDashboardStats);

export default router;
