import React from "react";
import { Box, Paper, Typography } from "@mui/material";


export default function Dashboard() {
return (
<Box sx={{ maxWidth: 1000, mx: "auto", mt: 2 }}>
<Typography variant="h5" gutterBottom>لوحة التحكم</Typography>
<Paper sx={{ p: 2 }}>
<Typography>مرحبًا بكِ في Fateness! هنا سنعرض الحصص، الحجوزات، والإشعارات.</Typography>
</Paper>
</Box>
);
}