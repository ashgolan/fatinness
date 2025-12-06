import express from "express";
import { webhookStripe } from "../controllers/payments.controller.js";

const router = express.Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    next();
  },
  webhookStripe
);

export default router;
