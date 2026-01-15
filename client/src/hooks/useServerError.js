import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { DateTime } from "luxon";

export default function useServerError() {
  const { t } = useTranslation();

  const handleServerError = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.log("SERVER ERROR:", {
      status,
      code: data?.code,
      message: error?.message,
    });

    // =================================================
    // 🟢 1️⃣ أخطاء منطقية متوقعة (لا تقتل التطبيق)
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

        toast.error(
          t("server.errors.weeklyLimitMessage", {
            max,
            start,
            end,
          }),
          { autoClose: 6000 }
        );
        return;
      }

      // 🧾 أي code معروف
      if (code) {
        toast.error(t(`server.errors.${code}`));
        return;
      }

      // fallback منطقي
      toast.error(t("server.errors.UNKNOWN_ERROR"));
      return;
    }

    // =================================================
    // 🔴 2️⃣ أخطاء شبكة حقيقية
    // =================================================
    if (
      error?.message === "Network Error" ||
      (!status && error?.request)
    ) {
      toast.error(t("server.errors.NETWORK_ERROR"));
      return;
    }

    // =================================================
    // 🔥 3️⃣ أخطاء سيرفر (5xx) — فقط هنا نعتبرها خطيرة
    // =================================================
    if (status >= 500) {
      toast.error(t("server.errors.SERVER_UNAVAILABLE"));
      return;
    }

    // =================================================
    // 🪫 fallback أخير
    // =================================================
    toast.error(t("server.errors.UNKNOWN_ERROR"));
  };

  return handleServerError;
}
