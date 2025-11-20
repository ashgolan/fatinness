import User from "../models/User.js";

let maintenanceMode = false; // 🔹 متغير الحالة

export const toggleMaintenance = async (req, res) => {
  try {
    // فقط المديرة يمكنها التبديل
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ code: "ADMIN_MAINTENANCE_UNAUTHORIZED" });
    }

    maintenanceMode = !maintenanceMode;

    if (maintenanceMode) {
      await User.updateMany({ role: { $ne: "admin" } }, { isBlocked: true });
    } else {
      await User.updateMany({ role: { $ne: "admin" } }, { isBlocked: false });
    }

    res.json({
      code: maintenanceMode
        ? "ADMIN_MAINTENANCE_ENABLED"
        : "ADMIN_MAINTENANCE_DISABLED",
      maintenanceMode,
    });
  } catch (err) {
    console.error("❌ Maintenance toggle error:", err);
    res.status(500).json({ code: "ADMIN_MAINTENANCE_ERROR" });
  }
};

// 🔹 دالة لإرجاع حالة النظام (للواجهة)
export const getMaintenanceStatus = (req, res) => {
  res.json({ maintenanceMode });
};

// 🔹 تصدير المتغير نفسه لاستخدامه في loginUser
export { maintenanceMode };
