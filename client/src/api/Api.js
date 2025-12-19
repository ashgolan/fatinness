// import axios from "axios";
// import Cookies from "js-cookie";

// let baseURL;

// // Local
// if (window.location.hostname === "localhost") {
//   baseURL = "http://localhost:4000";
// } else {
//   // Production
//   baseURL = process.env.REACT_APP_API_URL || "https://api.fatinness.cloud";
// }

// const Api = axios.create({
//   baseURL,
// });

// Api.interceptors.request.use((config) => {
//   const token = Cookies.get("JWT");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export { Api };
import axios from "axios";
import Cookies from "js-cookie";

const Api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

Api.interceptors.request.use((config) => {
  const token = Cookies.get("JWT");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { Api };
