import express from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";
import slotsRoutes from "./slots.routes.js";
import paymentsRoutes from "./payments.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);
router.use("/slots", slotsRoutes);
router.use("/payments", paymentsRoutes);

export default router;
