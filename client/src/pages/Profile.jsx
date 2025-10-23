import React, { useContext } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { UserContext } from "../context/UserContext";


export default function Profile() {
const { user } = useContext(UserContext);


return (
<Box sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
<Typography variant="h5" gutterBottom>الملف الشخصي</Typography>
<Paper sx={{ p: 2 }}>
{user ? (
<>
<Typography>الاسم: {user.username || user.name || "—"}</Typography>
<Typography>البريد: {user.email}</Typography>
<Typography>الدور: {user.role}</Typography>
</>
) : (
<Typography>لا توجد بيانات مستخدم.</Typography>
)}
</Paper>
</Box>
);
}