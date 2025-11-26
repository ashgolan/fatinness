import axios from "axios";
import Cookies from "js-cookie";

const Api = axios.create({
  baseURL: "fateness-production.up.railway.app",
});

Api.interceptors.request.use((config) => {
  const token = Cookies.get("JWT");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { Api };
