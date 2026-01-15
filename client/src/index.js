import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeModeProvider } from "./context/ThemeContext";
import { BrandProvider } from "./context/BrandContext";
// ✅ تسجيل الـ Service Worker المسؤول عن الإشعارات (Firebase)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((reg) => console.log("✅ Service Worker مسجل:", reg.scope))
    .catch((err) => console.error("❌ فشل تسجيل Service Worker:", err));
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>     {/* 🟣 الوضع الليلي والنهاري */}
        <BrandProvider>       {/* 🟢 الشعارات والبطاقات */}
          <UserProvider>      {/* 🟡 بيانات المستخدم */}
            <App />
            <ToastContainer position="top-center" autoClose={3000} rtl />
            <ToastContainer
              containerId="fcm"
              position="top-center"
              autoClose={false}     // 🔥 لا إغلاق تلقائي
              newestOnTop
              limit={3}
              closeOnClick={false}
              draggable={false}
              pauseOnHover
              rtl
            />
          </UserProvider>
        </BrandProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
