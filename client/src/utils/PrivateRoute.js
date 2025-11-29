import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useSystemSetupCheck } from "../hooks/useSystemSetupCheck";

export default function PrivateRoute({ role }) {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  // ⭐ فحص إذا النظام يحتاج إنشاء Super Admin
  const { loading: setupLoading } = useSystemSetupCheck();

  // 📌 لا نعرض أي شيء قبل اكتمال الفحصين (تحميل المستخدم + فحص النظام)
  if (loading || setupLoading) return null;

  // 🔹 إذا كان النظام يحتاج SuperAdmin (hook يقوم بتحويل المستخدم)
  // فلا نحتاج هنا أي منطق إضافي

  // 🔹 إذا لم يسجّل الدخول
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 🔹 إذا حددنا نوع الدور، والمستخدم ليس من هذا الدور
  if (role && user.role !== role) {
    return user.role === "admin" ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  // ✅ مستخدم مصرح له
  return <Outlet />;
}
