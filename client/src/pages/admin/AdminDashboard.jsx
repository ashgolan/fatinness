import React from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        لوحة إدارة النادي النسائي
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography sx={{ mb: 2 }}>
          👩‍💼 مرحبًا بكِ في لوحة التحكم الإدارية. اختاري ما تريدين إدارته:
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/admin/bookings")}
          >
            إدارة الحجوزات
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/admin/templates")}
          >
            إدارة القوالب الأسبوعية
          </Button>
          <Button
            variant="contained"
            color="inherit"
            onClick={() => navigate("/admin/users")}
          >
            قائمة المشتركات
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
