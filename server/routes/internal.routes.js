import express from "express";
import { internalSendBookingReminder } from "../controllers/internal.controller.js";

const router = express.Router();

router.post("/send-booking-reminder", internalSendBookingReminder);

export default router;
