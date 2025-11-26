import axios from "axios";
import Cookies from "js-cookie";

// 🔥 اختيار الرابط الصحيح تلقائياً
let baseURL = process.env.REACT_APP_API_URL;

// 👉 إذا التطبيق يعمل على localhost نستخدم السيرفر المحلي
if (window.location.hostname === "localhost") {
  baseURL = "http://localhost:4000";
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
