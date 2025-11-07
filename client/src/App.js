import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 🔹 مكونات التصميم
import { CssBaseline, GlobalStyles } from "@mui/material";

// 🔹 مزود الوضع العام
import { ThemeModeProvider } from "./context/ThemeContext"; // 🟣 هذا هو المزود الذي أنشأناه

// 🔹 المكونات العامة
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// 🔹 صفحات المستخدم
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Subscription from "./pages/Subscription";

// 🔹 أدوات
import PrivateRoute from "./utils/PrivateRoute";

// 🔹 صفحات المشرف
import AdminDashboard from "./pages/admin/AdminDashboard";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SlotsAdmin from "./pages/admin/SlotsAdmin";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import ControlCenter from "./pages/admin/ControlCenter";
import AdminSchedule from "./pages/admin/AdminSchedule";
import BookingsHub from "./pages/BookingsHub";
// import Splash from "./pages/Splash";

export default function App() {
  return (
    // 🟣 لفّ التطبيق بالكامل داخل ThemeModeProvider بدلاً من ThemeProvider المحلي
    <ThemeModeProvider>
      <GlobalStyles
        styles={{
          "input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
            WebkitTextFillColor: "inherit !important",
            transition: "background-color 9999s ease-in-out 0s",
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
        <Navbar />

        <div style={{ flex: 1, padding: "16px" }}>
          <Routes>
            {/* <Route path="/" element={<Splash />} /> */}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            {/* 🔹 مسارات المستخدم */}
            <Route element={<PrivateRoute role="user" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bookings" element={<Booking />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/bookings-Hub" element={<BookingsHub />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>

            {/* 🔹 مسارات المشرف */}
            <Route element={<PrivateRoute role="admin" />}>
              <Route path="/register" element={<Register />} />
              <Route path="/admin/control" element={<ControlCenter />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </ThemeModeProvider>
  );
}
