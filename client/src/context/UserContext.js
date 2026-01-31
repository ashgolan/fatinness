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
        // ✅ السيرفر هو مصدر الحقيقة
        const { data } = await Api.get("/users/me");
        setUser(data);
      } catch (err) {
        // ❌ غير مسجّل دخول أو انتهت الجلسة
        setUser(null);
      } finally {
        // ⭐ مهم جدًا: نُنهي التحميل دائمًا
        setLoadingUser(false);
      }
    };

    init();
  }, []);


  // useEffect(() => {
  //   if (loadingUser) return;
  //   if (!user || !user._id) return;

  //   registerFcmToken({ silent: true });
  // }, [loadingUser]);
  useEffect(() => {
    if (loadingUser) return;
    if (!user || !user._id) return;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isIOS) {
      // ✅ Android / Desktop → تسجيل تلقائي
      registerFcmToken({ silent: true });
    }
    // ❌ iPhone → ننتظر تفاعل المستخدم (زر)
  }, [loadingUser]);


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
