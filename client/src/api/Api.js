import axios from "axios";
import Cookies from "js-cookie";

let baseURL;

// Local
if (window.location.hostname === "localhost") {
  baseURL = "http://localhost:4000";
} else {
  // Production
  baseURL = process.env.REACT_APP_API_URL || "https://api.fatinness.cloud";
}

const Api = axios.create({
  baseURL,
  withCredentials: true, // ⭐ مهم جدًا لإرسال الكوكي تلقائيًا
});

// Interceptor: يعمل في الحالتين (لوكال + إنتاج)
Api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("JWT");

    // إذا أمكن قراءة التوكن (غالبًا في اللوكال)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // إذا لم يمكن (الإنتاج) → الكوكي تُرسل تلقائيًا
    return config;
  },
  (error) => Promise.reject(error)
);

export { Api };
