import express  from "express";
import multer   from "multer";
import { checkEmergencyKey, restoreFromZip } from "../controllers/emergency.controller.js";

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/check",   checkEmergencyKey);
router.post("/restore", upload.single("file"), restoreFromZip);

export default router;
