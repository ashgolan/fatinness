import React, { createContext, useEffect, useState, useMemo } from "react";
import { Api } from "../api/Api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 🔐 السيرفر يقرر إن كنت مسجّل دخول
        const { data } = await Api.get("/users/me");
        setUser(data);
      } catch (err) {
        // ❌ غير مسجّل أو التوكن منتهي
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
