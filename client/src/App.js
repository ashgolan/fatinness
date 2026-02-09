// App.jsx
import "./i18n/i18n";
import React, { useEffect, useState, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// ================= Context =================
import { UserContext } from "./context/UserContext";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeContext";
import { DirectionProvider, useDirection } from "./context/DirectionContext";

// ================= MUI =================
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "react-toastify/dist/ReactToastify.css";

// ================= RTL =================
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

// ================= Layout =================
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ================= Pages =================
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuperAdmin from "./pages/RegisterSuperAdmin";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Subscription from "./pages/Subscription";
import BookingsHub from "./pages/BookingsHub";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import DebugApi from "./pages/DebugApi";

// ================= Admin =================
import ControlCenter from "./pages/admin/ControlCenter";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SlotsAdmin from "./pages/admin/SlotsAdmin";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminSystemReset from "./pages/admin/AdminSystemReset";
import SubscriptionsReport from "./pages/admin/SubscriptionsReport";

// ================= Tools =================
import PrivateRoute from "./utils/PrivateRoute";
import { Api } from "./api/Api";
import i18n from "./i18n/i18n";
import { ToastContainer } from "react-toastify";

import InAppNotificationBanner from "./components/InAppNotificationBanner";
import { FCM_EVENT } from "./firebase/registerFcmToken";

// ======================================================
// RTL / LTR Wrapper
// ======================================================
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

// ======================================================
// 🚀 App
// ======================================================
export default function App() {
  const location = useLocation();
  const { user } = useContext(UserContext);

  // 🔥 أهم State
  const [needsSetup, setNeedsSetup] = useState(null); // null = loading

  // ======================================================
  // 🌍 تحميل اللغة من التخزين
  // ======================================================
  useEffect(() => {
    const savedLang = localStorage.getItem("appLanguage");
    if (!savedLang) return;

    i18n.changeLanguage(savedLang);
    document.documentElement.dir = savedLang === "en" ? "ltr" : "rtl";
  }, []);


  const [inAppNotification, setInAppNotification] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setInAppNotification(e.detail);

      // ⏳ يختفي تلقائيًا
      setTimeout(() => setInAppNotification(null), 8000);
    };

    window.addEventListener(FCM_EVENT, handler);
    return () => window.removeEventListener(FCM_EVENT, handler);
  }, []);


  // ======================================================
  // 🌍 مزامنة اللغة من المستخدم
  // ======================================================
  useEffect(() => {
    if (!user?.preferredLanguage) return;
    if (i18n.language === user.preferredLanguage) return;

    i18n.changeLanguage(user.preferredLanguage);
    localStorage.setItem("appLanguage", user.preferredLanguage);
    document.documentElement.dir =
      user.preferredLanguage === "en" ? "ltr" : "rtl";
  }, [user]);

  // ======================================================
  // 🔐 فحص first-run (دائمًا – بدون Token)
  // ======================================================
  useEffect(() => {
    Api.get("/auth/check-first-run")
      .then((res) => setNeedsSetup(res.data.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  // ======================================================
  // ⏳ أثناء الفحص لا نعرض Routes
  // ======================================================
  if (needsSetup === null) {
    return null; // أو Loader إذا حاب
  }

  // ======================================================
  // 🚨 النظام بحاجة تهيئة (Super Admin)
  // ======================================================
  if (needsSetup) {
    return (
      <Routes>
        <Route
          path="/register-superadmin"
          element={<RegisterSuperAdmin />}
        />
        <Route
          path="*"
          element={<Navigate to="/register-superadmin" replace />}
        />
      </Routes>
    );
  }

  const isSplash = location.pathname === "/";

  // ======================================================
  // ✅ التطبيق الطبيعي
  // ======================================================
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
            <ToastContainer
              containerId="fcm"
              position="top-center"
              newestOnTop
              closeButton={false}
              draggable={false}
              limit={1}
              toastStyle={{
                width: "100%",
                margin: 0,
                borderRadius: 0,
                padding: 0,
              }}
            />

            {/* 🔔 FCM Toast – Full Width Banner */}
            <ToastContainer
              containerId="fcm"
              position="top-center"
              newestOnTop
              closeButton={false}
              draggable={false}
              limit={1}
              toastStyle={{
                width: "100%",
                margin: 0,
                borderRadius: 0,
                padding: 0,
              }}
            />


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
                    <Route
                      path="/bookings-hub"
                      element={<BookingsHub />}
                    />
                    <Route
                      path="/subscription"
                      element={<Subscription />}
                    />
                  </Route>

                  {/* Admin */}
                  <Route element={<PrivateRoute role="admin" />}>
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/admin/control"
                      element={<ControlCenter />}
                    />
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
                    <Route
                      path="/admin/bookings"
                      element={<BookingsAdmin />}
                    />
                    <Route
                      path="/admin/schedule"
                      element={<AdminSchedule />}
                    />
                    <Route
                      path="/admin/users"
                      element={<UsersAdmin />}
                    />
                    <Route
                      path="/admin/slots"
                      element={<SlotsAdmin />}
                    />
                    <Route
                      path="/admin/notifications"
                      element={<AdminNotifications />}
                    />
                    <Route
                      path="/admin/reports"
                      element={<AdminReports />}
                    />
                    <Route
                      path="/admin/settings"
                      element={<AdminSettings />}
                    />
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
