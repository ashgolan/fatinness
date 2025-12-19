import axios from "axios";
import Cookies from "js-cookie";

const baseURL =
  process.env.REACT_APP_API_URL || "http://localhost:4000";

const Api = axios.create({
  baseURL,
});

Api.interceptors.request.use((config) => {
  const token = Cookies.get("JWT");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { Api };
