import { useEffect, useState } from "react";
import { Api } from "../api/Api";
import { useLocation } from "react-router-dom";
import { FCM_EVENT } from "../firebase/registerFcmToken";

export default function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const fetchUnreadCount = async () => {
    try {
      const { data } = await Api.get("/notifications");
      const unread = data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Unread fetch error:", err);
    }
  };

  // 🔥 عند تحميل التطبيق أول مرة
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // 🔥 إذا دخل صفحة الإشعارات → اجلب العدد الحقيقي من السيرفر
  useEffect(() => {
    if (location.pathname === "/notifications") {
      fetchUnreadCount();
    }
  }, [location.pathname]);

  // 🔔 عند وصول إشعار جديد
  useEffect(() => {
    const handler = () => {
      setUnreadCount((prev) => prev + 1);

      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    window.addEventListener(FCM_EVENT, handler);

    return () => {
      window.removeEventListener(FCM_EVENT, handler);
    };
  }, []);

  // 🔁 عند عمل mark all أو mark single
  useEffect(() => {
    const handleRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener("refresh-unread-count", handleRefresh);

    return () => {
      window.removeEventListener("refresh-unread-count", handleRefresh);
    };
  }, []);

  return unreadCount;
}
