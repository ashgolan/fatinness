import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export default function useServerError() {
  const { t } = useTranslation();

  const handleServerError = (error) => {
    console.log("SERVER ERROR:", error?.response?.data);

    // 🌐 Network Error (السيرفر غير متصل)
    if (error?.message === "Network Error") {
      return toast.error(t("server.errors.NETWORK_ERROR"));
    }

    // ✅ الحالة الأساسية: السيرفر يرجّع code
    const code = error?.response?.data?.code;
    if (code) {
      return toast.error(t(`server.errors.${code}`));
    }

    // ⛔ request بدون response (timeout / no response)
    if (error?.request) {
      return toast.error(t("server.errors.NETWORK_ERROR"));
    }

    // fallback أخير
    return toast.error(t("server.errors.UNKNOWN_ERROR"));
  };

  return handleServerError;
}
