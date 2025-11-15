// client/src/pages/Subscription.jsx
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
import { useTranslation } from "react-i18next";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isPaymentEnabled = process.env.REACT_APP_PAYMENT_MODE === "production";

  // جلب الاشتراك
  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch (err) {
      toast.error(t("subscription.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // التجديد
  const handleRenew = async () => {
    setRenewing(true);
    try {
      if (isPaymentEnabled) {
        const { data } = await Api.post("/payments/checkout", {
          plan: "monthly",
        });

        if (data?.url) {
          window.location.href = data.url;
        } else {
          toast.error(t("subscription.errors.paymentSession"));
        }
      } else {
        await Api.post("/users/renew-subscription");
        toast.success(t("subscription.toasts.renewSuccess"));

        fetchSubscription();

        setTimeout(() => navigate("/available-slots"), 3000);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t("subscription.errors.renewFail"));
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
    ? new Date(subscription.currentPeriodStart).toLocaleDateString()
    : "—";

  const endDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
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
        {t("subscription.title")}
      </Typography>

      <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h6" mb={2}>
          {t("subscription.status")}:{" "}
          <span style={{ color: isActive ? "green" : "red" }}>
            {isActive ? t("subscription.active") : t("subscription.inactive")}
          </span>
        </Typography>

        <Typography variant="body1">
          <strong>{t("subscription.startDate")}:</strong> {startDate}
        </Typography>
        <Typography variant="body1" mb={2}>
          <strong>{t("subscription.endDate")}:</strong> {endDate}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleRenew}
          disabled={renewing}
        >
          {renewing ? <CircularProgress size={24} /> : t("subscription.buttons.renew")}
        </Button>

        <Typography
          variant="caption"
          display="block"
          mt={2}
          color="text.secondary"
        >
          {isPaymentEnabled
            ? t("subscription.notes.production")
            : t("subscription.notes.development")}
        </Typography>
      </Paper>
    </Box>
  );
}
