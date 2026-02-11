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

  // عند دخول صفحة الإشعارات → صفر
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // 🔥 الاستماع الحقيقي لإشعار FCM
  useEffect(() => {
    const handler = () => {
      // زد فورًا
      setUnreadCount((prev) => prev + 1);

      // مزامنة بعد قليل
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    window.addEventListener(FCM_EVENT, handler);

    return () => {
      window.removeEventListener(FCM_EVENT, handler);
    };
  }, []);

  return unreadCount;
}
