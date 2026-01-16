import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { DateTime } from "luxon";

const ERROR_TOAST_ID = "global-server-error";

export default function useServerError() {
  const { t } = useTranslation();

  const showError = (message, options = {}) => {
    toast.dismiss(ERROR_TOAST_ID); // ⛔ أغلق أي toast سابق
    toast.error(message, {
      toastId: ERROR_TOAST_ID,      // 🔒 Toast واحد فقط
      autoClose: 6000,
      ...options,
    });
  };

  const handleServerError = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.log("SERVER ERROR:", {
      status,
      code: data?.code,
      message: error?.message,
    });

    // =================================================
    // 🟢 1️⃣ أخطاء منطقية متوقعة (Business rules)
    // =================================================
    if (status && status < 500) {
      const code = data?.code;

      // 🌸 تجاوز الحد الأسبوعي
      if (code === "ADMIN_BOOKING_WEEKLY_LIMIT") {
        const { max, weekStart, weekEnd } = data || {};

        const start = weekStart
          ? DateTime.fromISO(weekStart).toFormat("dd/LL")
          : "";
        const end = weekEnd
          ? DateTime.fromISO(weekEnd).toFormat("dd/LL")
          : "";

        showError(
          t("server.errors.weeklyLimitMessage", {
            max,
            start,
            end,
          })
        );
        return;
      }

      // 🧾 أي code معروف
      if (code) {
        showError(t(`server.errors.${code}`));
        return;
      }

      showError(t("server.errors.UNKNOWN_ERROR"));
      return;
    }

    // =================================================
    // 🔴 2️⃣ أخطاء شبكة
    // =================================================
    if (error?.message === "Network Error" || (!status && error?.request)) {
      showError(t("server.errors.NETWORK_ERROR"));
      return;
    }

    // =================================================
    // 🔥 3️⃣ أخطاء سيرفر (5xx)
    // =================================================
    if (status >= 500) {
      showError(t("server.errors.SERVER_UNAVAILABLE"));
      return;
    }

    // =================================================
    // 🪫 fallback أخير
    // =================================================
    showError(t("server.errors.UNKNOWN_ERROR"));
  };

  return handleServerError;
}
