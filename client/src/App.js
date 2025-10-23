import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PrivateRoute from "./utils/PrivateRoute";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import TemplatesAdmin from "./pages/admin/TemplatesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SlotsAdmin from "./pages/admin/SlotsAdmin";

export default function App() {
  return (
    <div
      className="app-container"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <div style={{ flex: 1, padding: "16px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PrivateRoute role="user" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          {/* 🔹 مسارات المشرف */}
       <Route element={<PrivateRoute role="admin" />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/bookings" element={<BookingsAdmin />} />
  <Route path="/admin/templates" element={<TemplatesAdmin />} />
  <Route path="/admin/users" element={<UsersAdmin />} />
  <Route path="/admin/slots" element={<SlotsAdmin />} />

</Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
