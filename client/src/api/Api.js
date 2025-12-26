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

// ❌ لا نضيف Authorization Header إطلاقًا
// ❌ Cookie httpOnly يُرسل تلقائيًا

export { Api };
