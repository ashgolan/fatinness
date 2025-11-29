// App.jsx
import React from "react";
import "./i18n/i18n";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useThemeMode } from "./context/ThemeContext"; // 👈 تأكد أنها موجودة

// 🔹 MUI
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
// 🔹 RTL Support
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// 🔹 Context
import { ThemeModeProvider } from "./context/ThemeContext";
import { DirectionProvider, useDirection } from "./context/DirectionContext";

// 🔹 Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// 🔹 User pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Subscription from "./pages/Subscription";
import BookingsHub from "./pages/BookingsHub";
import Splash from "./pages/Splash";

// 🔹 Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SlotsAdmin from "./pages/admin/SlotsAdmin";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import ControlCenter from "./pages/admin/ControlCenter";
import AdminSchedule from "./pages/admin/AdminSchedule";

// 🔹 Tools
import PrivateRoute from "./utils/PrivateRoute";
import i18n from "./i18n/i18n";
import Gallery from "./pages/Gallery";
import DebugApi from "./pages/DebugApi";
import AdminSystemReset from "./pages/admin/AdminSystemReset";
import RegisterSuperAdmin from "./pages/RegisterSuperAdmin";

import { useSystemSetupCheck } from "./hooks/useSystemSetupCheck";
// ======================================================
// ⚙️ مكوّن Wrapper خاص لضبط الـ RTL/LTR بحسب اللغة
// ======================================================

function DirectionWrapper({ children }) {
  const { direction } = useDirection();
  const { theme } = useThemeMode(); // 👈 أخذ الثيم الأصلي (Light/Dark)

  // دمج الاتجاه مع الثيم الأصلي
  const themed = React.useMemo(
    () => ({
      ...theme,
      direction,
    }),
    [theme, direction]
  );

  const cache = createCache({
    key: direction === "rtl" ? "rtl" : "css",
    stylisPlugins: direction === "rtl" ? [rtlPlugin] : [],
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={themed}>{children}</ThemeProvider>
    </CacheProvider>
  );
}

// ======================================================
// 🚀 التطبيق الرئيسي
// ======================================================
export default function App() {
  const location = useLocation();
  // ✔️ First Run Protection
  const { loading } = useSystemSetupCheck();

  if (loading) return null;

  // 🔥 إخفاء Navbar & Footer في صفحة Splash فقط
  const isSplash = location.pathname === "/";

  // 🔥 تحميل اللغة المحفوظة
  const savedLang = localStorage.getItem("appLanguage") || "ar";
  i18n.changeLanguage(savedLang);

  return (
    <ThemeModeProvider>
      <DirectionProvider>
        <DirectionWrapper>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* إعدادات الحقول */}
            <GlobalStyles
              styles={{
                "input:-webkit-autofill": {
                  WebkitBoxShadow: "0 0 1000px transparent inset !important",
                  WebkitTextFillColor: "inherit !important",
                },
              }}
            />
            <CssBaseline />

            {/* بنية التطبيق */}
            <div
              className="app-container"
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* ❌ إخفاء Navbar في صفحة Splash */}
              {!isSplash && <Navbar />}

              {/* محتوى الصفحة */}
              <div style={{ flex: 1, padding: isSplash ? 0 : "16px" }}>
                <Routes>
                  {/* 🌟 صفحة Splash */}
                  <Route path="/" element={<Splash />} />
<Route path="/register-superadmin" element={<RegisterSuperAdmin />} />

                  {/* تسجيل الدخول */}
                  <Route path="/login" element={<Login />} />
<Route path="/debug-api" element={<DebugApi />} />

                  {/* 🔹 مسارات المستخدم */}
                  <Route element={<PrivateRoute role="user" />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/bookings" element={<Booking />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/bookings-Hub" element={<BookingsHub />} />
                    <Route path="/subscription" element={<Subscription />} />
                  </Route>

                  {/* 🔹 مسارات المشرف */}
                  <Route element={<PrivateRoute role="admin" />}>
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin/control" element={<ControlCenter />} />
                    <Route
                      path="/admin/dashboard"
                      element={<AdminDashboard />}
                    />
                    <Route path="/admin/system-reset" element={<AdminSystemReset/>} />

                    <Route path="/admin/bookings" element={<BookingsAdmin />} />
                    <Route path="/admin/schedule" element={<AdminSchedule />} />
                    <Route path="/admin/users" element={<UsersAdmin />} />
                    <Route path="/admin/slots" element={<SlotsAdmin />} />
                    <Route
                      path="/admin/notifications"
                      element={<AdminNotifications />}
                    />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Route>

                  {/* 🔹 إعادة توجيه افتراضية */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </div>

              {/* ❌ إخفاء Footer في صفحة Splash */}
              {!isSplash && <Footer />}
            </div>
          </LocalizationProvider>
        </DirectionWrapper>
      </DirectionProvider>
    </ThemeModeProvider>
  );
}
