import React, { useContext, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import { Api } from "../../api/Api";
import { UserContext } from "../../context/UserContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useServerError from "../../hooks/useServerError";

const AdminSystemReset = () => {
  const { user } = useContext(UserContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const handleServerError = useServerError();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState(null);
  const [processing, setProcessing] = useState(false);

  // ❌ ليس SuperAdmin
  if (!user?.isSuperAdmin) {
    return (
      <Box dir={i18n.dir()} p={3}>
        <Typography color="error" variant="h6" align="center" fontWeight={600}>
          {t("systemReset.noPermission")}
        </Typography>
      </Box>
    );
  }

  // 🔧 خيارات إعادة الضبط
  const resetOptions = [
    {
      key: "light",
      title: t("systemReset.light.title"),
      description: t("systemReset.light.desc"),
      endpoint: "/admin/reset/light",
      color: "#ed6c02",
    },
    {
      key: "medium",
      title: t("systemReset.medium.title"),
      description: t("systemReset.medium.desc"),
      endpoint: "/admin/reset/medium",
      color: "#d32f2f",
    },
    {
      key: "hard",
      title: t("systemReset.hard.title"),
      description: t("systemReset.hard.desc"),
      endpoint: "/admin/reset/hard",
      color: "#b71c1c",
    },
    {
      key: "factory",
      title: t("systemReset.factory.title"),
      description: t("systemReset.factory.desc"),
      endpoint: "/admin/reset/factory",
      color: "#7f0000",
    },
  ];

  const selectedOption = resetOptions.find((o) => o.key === resetType);

  const handleConfirm = async () => {
    if (!selectedOption) return;

    setProcessing(true);
    try {
      await Api.post(selectedOption.endpoint);

      toast.success(t("systemReset.success"));

      setConfirmOpen(false);
      setResetType(null);

      if (selectedOption.key === "factory") {
        window.location.href = "/register-superadmin";
      }

    } catch (err) {
      handleServerError(err);
      setConfirmOpen(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box dir={i18n.dir()} p={3}>
      {/* عنوان الصفحة */}
      <Typography variant="h4" mb={4} textAlign="center" fontWeight={700}>
        {t("systemReset.pageTitle")}
      </Typography>

      {/* الكروت */}
      <Grid container spacing={3}>
        {resetOptions.map((opt) => (
          <Grid item xs={12} md={6} key={opt.key}>
            <Card
              sx={{
                borderLeft: `5px solid ${opt.color}`,
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                p: 1,
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {opt.title}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ opacity: 0.8, mb: 2, lineHeight: 1.6 }}
                >
                  {opt.description}
                </Typography>

                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setResetType(opt.key);
                    setConfirmOpen(true);
                  }}
                >
                  {t("systemReset.execute")}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* نافذة التأكيد */}
      <Dialog open={confirmOpen} onClose={() => !processing && setConfirmOpen(false)}>
        <DialogTitle>{t("systemReset.confirmTitle")}</DialogTitle>

        <DialogContent>
          <Typography>
            {t("systemReset.confirmMessage")}{" "}
            <strong>{selectedOption?.title}</strong>
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={processing}
          >
            {t("systemReset.cancel")}
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              t("systemReset.confirmButton")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSystemReset;
