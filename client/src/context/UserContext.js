// client/src/context/UserContext.jsx
import React, { createContext, useEffect, useState, useMemo } from "react";
import { Api } from "../api/Api";
import { registerFcmToken } from "../firebase/registerFcmToken";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ===============================
  // 👤 تحميل المستخدم (السيرفر هو المصدر)
  // ===============================
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await Api.get("/users/me");
        setUser(data);

        // 🔔 بعد التأكد أن المستخدم موجود → نسجل FCM
        if (data) {
          registerFcmToken({ silent: true });
        }

      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    init();
  }, []);

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
