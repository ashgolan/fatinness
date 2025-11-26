import axios from "axios";
import Cookies from "js-cookie";

// 🔥 تحديد الرابط حسب البيئة تلقائياً
let baseURL;

// 👉 إذا نعمل محلياً
if (window.location.hostname === "localhost") {
  baseURL = "http://localhost:4000";
} else {
  // 👉 إذا نحن على Production نقرأ من ENV
  baseURL = process.env.REACT_APP_API_URL || "https://fateness-production.up.railway.app";
}

const Api = axios.create({
  baseURL,
});

// 🔐 إضافة JWT تلقائياً
Api.interceptors.request.use((config) => {
  const token = Cookies.get("JWT");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { Api };
