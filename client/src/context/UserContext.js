// client/src/context/UserContext.jsx
import React, { createContext, useEffect, useState, useMemo } from "react";
import { Api } from "../api/Api";
import { registerFcmToken } from "../firebase/registerFcmToken";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ===============================
  // 👤 تحميل المستخدم (المصدر: السيرفر)
  // ===============================
  useEffect(() => {
    const init = async () => {
      try {
        const hasCookie = document.cookie.includes("JWT=");
        if (!hasCookie) {
          setUser(null);
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
