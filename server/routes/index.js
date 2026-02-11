import express from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import adminSlotsRoutes from "./adminSlots.routes.js";
import adminRoutes from "./admin.routes.js";
import slotsRoutes from "./slots.routes.js";
import paymentsRoutes from "./payments.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import internalRoutes from "./internal.routes.js";
import userNotifications from "./userNotifications.routes.js";
// import googleRoutes from "./google.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/slots", adminSlotsRoutes);
router.use("/slots", slotsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/internal", internalRoutes);
// router.use("/google", googleRoutes);

router.use("/notifications",userNotifications);

export default router;
