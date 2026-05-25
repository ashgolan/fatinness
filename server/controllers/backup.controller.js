import { buildBackupZip, runBackup } from "../services/backup.service.js";

// ======================================================
// 📥 تنزيل نسخة احتياطية فورية (من الـ Admin Settings)
// ======================================================
export const downloadBackup = async (req, res) => {
  try {
    const { zipBuffer, label } = await buildBackupZip();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="fatinness-backup-${label}.zip"`
    );
    res.setHeader("Content-Length", zipBuffer.length);

    return res.send(zipBuffer);
  } catch (error) {
    console.error("❌ downloadBackup error:", error);
    return res.status(500).json({ code: "BACKUP_DOWNLOAD_FAILED" });
  }
};

// ======================================================
// 📧 إرسال نسخة احتياطية يدوياً على الإيميل
// ======================================================

