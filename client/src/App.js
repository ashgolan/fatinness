// App.jsx
import "./i18n/i18n";
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// 🔹 MUI
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

// 🔹 RTL
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// 🔹 Context
import { ThemeModeProvider, useThemeMode } from "./context/ThemeContext";
import { DirectionProvider, useDirection } from "./context/DirectionContext";

// 🔹 Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// 🔹 Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Subscription from "./pages/Subscription";
import BookingsHub from "./pages/BookingsHub";
import Splash from "./pages/Splash";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import DebugApi from "./pages/DebugApi";
import RegisterSuperAdmin from "./pages/RegisterSuperAdmin";

// 🔹 Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SlotsAdmin from "./pages/admin/SlotsAdmin";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import ControlCenter from "./pages/admin/ControlCenter";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminSystemReset from "./pages/admin/AdminSystemReset";
import SubscriptionsReport from "./pages/admin/SubscriptionsReport";

// 🔹 Tools
import PrivateRoute from "./utils/PrivateRoute";
import { Api } from "./api/Api";
import i18n from "./i18n/i18n";
import { registerFcmToken } from "./firebase/registerFcmToken";

// ================================
// RTL / LTR Wrapper
// ================================
function DirectionWrapper({ children }) {
  const { direction } = useDirection();
  const { theme } = useThemeMode();

  const themed = React.useMemo(
    () => ({ ...theme, direction }),
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

// ================================
// 🚀 App
// ================================
export default function App() {
  const location = useLocation();
  const [needsSetup, setNeedsSetup] = useState(false);

  // ✅ تحميل اللغة مرة واحدة فقط
  useEffect(() => {
    const savedLang = localStorage.getItem("appLanguage") || "ar";
    i18n.changeLanguage(savedLang);
  }, []);

  // ✅ check-first-run فقط إذا يوجد Token
  useEffect(() => {

    Api.get("/auth/check-first-run")
      .then((res) => setNeedsSetup(res.data.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);


  // 🔔 FCM retry ذكي عند العودة للتطبيق
  // useEffect(() => {
  //   const retryFcm = () => {
  //     registerFcmToken({ silent: true });
  //   };

  //   window.addEventListener("focus", retryFcm);

  //   document.addEventListener("visibilitychange", () => {
  //     if (document.visibilityState === "visible") {
  //       retryFcm();
  //     }
  //   });

  //   return () => {
  //     window.removeEventListener("focus", retryFcm);
  //     document.removeEventListener("visibilitychange", retryFcm);
  //   };
  // }, []);


  const isSplash = location.pathname === "/";

  return (
    <ThemeModeProvider>
      <DirectionProvider>
        <DirectionWrapper>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <GlobalStyles
              styles={{
                "input:-webkit-autofill": {
                  WebkitBoxShadow: "0 0 1000px transparent inset !important",
                  WebkitTextFillColor: "inherit !important",
                },
              }}
            />
            <CssBaseline />

            <div
              className="app-container"
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {!isSplash && <Navbar />}

              <div style={{ flex: 1, padding: isSplash ? 0 : "16px" }}>
                <Routes>
                  <Route path="/" element={<Splash />} />
                  <Route
                    path="/register-superadmin"
                    element={<RegisterSuperAdmin />}
                  />

                  <Route path="/login" element={<Login />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/debug-api" element={<DebugApi />} />

                  {/* User */}
                  <Route element={<PrivateRoute role="user" />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/bookings" element={<Booking />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/bookings-hub" element={<BookingsHub />} />
                    <Route path="/subscription" element={<Subscription />} />
                  </Route>

                  {/* Admin */}
                  <Route element={<PrivateRoute role="admin" />}>
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin/control" element={<ControlCenter />} />
                    <Route
                      path="/admin/dashboard"
                      element={<AdminDashboard />}
                    />
                    <Route
                      path="/admin/system-reset"
                      element={<AdminSystemReset />}
                    />
                    <Route
                      path="/admin/subscriptions-report"
                      element={<SubscriptionsReport />}
                    />
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

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>

              {!isSplash && <Footer />}
            </div>
          </LocalizationProvider>
        </DirectionWrapper>
      </DirectionProvider>
    </ThemeModeProvider>
  );
}
