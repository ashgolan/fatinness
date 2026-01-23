import axios from "axios";

let baseURL;

// Local
if (window.location.hostname === "localhost") {
  baseURL = "http://localhost:4000";
} else {
  // Production
  baseURL = "https://api.fatinness.cloud";
}

const Api = axios.create({
  baseURL,
  withCredentials: true, // ⭐ ضروري لإرسال Cookie
});

Api.interceptors.request.use((config) => {
  // 🧠 جرّب جلب التوكن من التخزين
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  // 📱 في الموبايل / Postman → Bearer
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { Api };
