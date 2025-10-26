import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const navigate = useNavigate();

  // 🧩 وضع التشغيل
  const isPaymentEnabled = process.env.REACT_APP_PAYMENT_MODE === "production";
  // يمكنك ضبطه في ملف .env مثلاً:
  // REACT_APP_PAYMENT_MODE=development  ← للتجارب
  // REACT_APP_PAYMENT_MODE=production   ← عند تفعيل الدفع

  // 🔹 جلب بيانات الاشتراك
  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تحميل بيانات الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // 🔹 عند الضغط على "تجديد الاشتراك"
  const handleRenew = async () => {
    setRenewing(true);
    try {
      if (isPaymentEnabled) {
        // 🔹 الوضع الحقيقي → بوابة الدفع (Stripe / Bit)
        const { data } = await Api.post("/payments/checkout", {
          plan: "monthly",
        });
        if (data?.url) {
          window.location.href = data.url; // فتح صفحة الدفع الآمنة
        } else {
          toast.error("تعذر إنشاء جلسة الدفع");
        }
      } else {
        // 🔹 الوضع التجريبي → تجديد محلي سريع
        await Api.post("/users/renew-subscription");
        toast.success("تم تجديد الاشتراك بنجاح ✅ سيتم تحويلك إلى صفحة الحجز...");

        // إعادة تحميل بيانات المستخدم
        fetchSubscription();

        // ⏳ إعادة التوجيه التلقائي بعد 3 ثوانٍ
        setTimeout(() => navigate("/available-slots"), 3000);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تجديد الاشتراك");
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  const subscription = user?.subscription;
  const isActive = subscription?.active;
  const startDate = subscription?.currentPeriodStart
    ? new Date(subscription.currentPeriodStart).toLocaleDateString("ar-EG")
    : "—";
  const endDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("ar-EG")
    : "—";

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 700,
        mx: "auto",
        mt: 5,
        px: 2,
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      <Typography variant="h5" textAlign="center" gutterBottom>
        💳 اشتراكك الشهري
      </Typography>

      <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h6" mb={2}>
          الحالة:{" "}
          <span style={{ color: isActive ? "green" : "red" }}>
            {isActive ? "نشط ✅" : "منتهي ❌"}
          </span>
        </Typography>

        <Typography variant="body1">
          <strong>تاريخ البداية:</strong> {startDate}
        </Typography>
        <Typography variant="body1" mb={2}>
          <strong>تاريخ النهاية:</strong> {endDate}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleRenew}
          disabled={renewing}
        >
          {renewing ? <CircularProgress size={24} /> : "تجديد الاشتراك"}
        </Button>

        <Typography
          variant="caption"
          display="block"
          mt={2}
          color="text.secondary"
        >
          {isPaymentEnabled
            ? "🔒 سيتم نقلك إلى صفحة الدفع الآمنة"
            : "🧪 وضع التطوير: التجديد يتم محليًا دون دفع"}
        </Typography>
      </Paper>
    </Box>
  );
}
