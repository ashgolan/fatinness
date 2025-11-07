import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeModeProvider } from "./context/ThemeContext";
import { BrandProvider } from "./context/BrandContext";

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
          </UserProvider>
        </BrandProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
