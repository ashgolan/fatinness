import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { DateTime } from "luxon";

export default function useServerError() {
  const { t } = useTranslation();

  const handleServerError = (error) => {
    console.log("SERVER ERROR:", error?.response?.data);

    // 🌐 Network Error (السيرفر غير متصل)
    if (error?.message === "Network Error") {
      return toast.error(t("server.errors.NETWORK_ERROR"));
    }

    // 🧾 الكود القادم من السيرفر
    const code = error?.response?.data?.code;

    // 🌸 رسالة ذكية للحد الأسبوعي
    if (code === "ADMIN_BOOKING_WEEKLY_LIMIT") {
      const { max, weekStart, weekEnd } = error.response.data;

      const start = DateTime.fromISO(weekStart).toFormat("dd/LL");
      const end = DateTime.fromISO(weekEnd).toFormat("dd/LL");

      return toast.error(
        t("server.errors.weeklyLimitMessage", {
          max,
          start,
          end,
        }),
        {
          autoClose: 6000,
        }
      );
    }

    // ✅ الحالة العامة: ترجمة حسب code
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
