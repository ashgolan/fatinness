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
} from "@mui/material";
import { Api } from "../../api/Api";
import { UserContext } from "../../context/UserContext";
import { useTranslation } from "react-i18next";

const AdminSystemReset = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState(null);

  // ❌ إذا لم يكن SuperAdmin
  if (!user?.isSuperAdmin) {
    return (
      <Box p={3}>
        <Typography color="error" variant="h6" align="center">
          {t("systemReset.noPermission")}
        </Typography>
      </Box>
    );
  }

  // جميع خيارات Reset — الآن مترجمة
  const resetOptions = [
    {
      key: "light",
      title: t("systemReset.light.title"),
      description: t("systemReset.light.desc"),
      endpoint: "/admin/reset/light",
    },
    {
      key: "medium",
      title: t("systemReset.medium.title"),
      description: t("systemReset.medium.desc"),
      endpoint: "/admin/reset/medium",
    },
    {
      key: "hard",
      title: t("systemReset.hard.title"),
      description: t("systemReset.hard.desc"),
      endpoint: "/admin/reset/hard",
    },
    {
      key: "factory",
      title: t("systemReset.factory.title"),
      description: t("systemReset.factory.desc"),
      endpoint: "/admin/reset/factory",
    },
  ];

  const handleConfirm = async () => {
    try {
      const option = resetOptions.find((o) => o.key === resetType);
      await Api.post(option.endpoint);

      alert(t("systemReset.success"));
    } catch (err) {
      console.error(err);
      alert(t("systemReset.error"));
    }

    setConfirmOpen(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} textAlign="center">
        {t("systemReset.pageTitle")}
      </Typography>

      <Grid container spacing={3}>
        {resetOptions.map((opt) => (
          <Grid item xs={12} md={6} key={opt.key}>
            <Card sx={{ borderLeft: "5px solid #d32f2f" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {opt.title}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ opacity: 0.8, marginBottom: 2 }}
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

      {/* ⚠️ نافذة تأكيد */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("systemReset.confirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("systemReset.confirmMessage")}{" "}
            <strong>{resetType?.toUpperCase()}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {t("systemReset.cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>
            {t("systemReset.confirmButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSystemReset;
