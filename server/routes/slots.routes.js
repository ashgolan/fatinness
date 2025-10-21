import express from "express";
import { getWeekSlots, getDaySlots } from "../controllers/slots.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/week", getWeekSlots);
router.get("/day/:date", getDaySlots);

export default router;
