import React, { createContext, useEffect, useState, useMemo } from "react";
import { Api } from "../api/Api";
import { registerFcmToken } from "../firebase/registerFcmToken";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 🧠 الحل الذكي: لا نطلب /users/me إلا إذا يوجد Cookie
        const hasCookie = document.cookie.includes("JWT=");
        if (!hasCookie) {
          setLoadingUser(false);
          return;
        }

        const { data } = await Api.get("/users/me");
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!user || !user._id) return;

    // 🔔 تسجيل FCM تلقائي بعد login
    registerFcmToken({ silent: true });
  }, [user?._id]);

  const value = useMemo(
    () => ({ user, setUser, loadingUser }),
    [user, loadingUser]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
