import axios from "axios";
import Cookies from "js-cookie";

const Api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://fateness-production.up.railway.app"
      : "http://localhost:4000",
});

// إرفاق التوكن تلقائيًا إن وُجد
Api.interceptors.request.use((config) => {
  const token = Cookies.get("JWT");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { Api };
