import express from "express";
import { getWeekSlots, getDaySlots, getUpcomingSlots } from "../controllers/slots.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/week", getWeekSlots);
router.get("/day/:date", getDaySlots);
router.get("/upcoming", getUpcomingSlots); // ✅ المسار الجديد

export default router;
