import express from "express";
import {
  createCheckoutSession,
  cancelSubscription,
  getSubscriptionStatus,
} from "../controllers/payments.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/checkout", createCheckoutSession);
router.get("/status", getSubscriptionStatus);
router.post("/cancel", cancelSubscription);

export default router;
