import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function PrivateRoute({ role }) {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  if (loading) return null; // يمكن لاحقًا وضع Spinner

  // 🔹 إذا لم يسجّل الدخول
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 🔹 إذا حددنا نوع دور، والمستخدم ليس من هذا الدور
  if (role && user.role !== role) {
    // إعادة التوجيه حسب نوع المستخدم
    return user.role === "admin" ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  // ✅ مستخدم مصرح له
  return <Outlet />;
}
