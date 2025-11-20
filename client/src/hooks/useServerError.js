import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export default function useServerError() {
  const { t } = useTranslation();

  const handleServerError = (error) => {
    console.log("SERVER ERROR:", error);

    // 🔥 أهم شيء: التحقق من Network Error (فصل السيرفر)
    if (error?.message === "Network Error") {
      return toast.error(t("server:NETWORK_ERROR"));
    }

    // إذا السيرفر رجّع code
    const code = error?.response?.data?.code;
    if (code) {
      return toast.error(t(`server:${code}`));
    }

    // إذا السيرفر رجّع message فقط
    const message = error?.response?.data?.message;
    if (message) {
      return toast.error(message);
    }

    // إذا السيرفر لم يرجع رد (مثل timeout)
    if (error?.request) {
      return toast.error(t("server:NETWORK_ERROR"));
    }

    // fallback أخير
    return toast.error(t("server:UNKNOWN_ERROR"));
  };

  return handleServerError;
}
