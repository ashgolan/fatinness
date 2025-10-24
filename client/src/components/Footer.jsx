import React from "react";
import { Box, Typography } from "@mui/material";


export default function Footer() {
return (
<Box component="footer" sx={{ textAlign: "center", py: 2, color: "#666" }}>
<Typography variant="body2">© {new Date().getFullYear()} Fateiness — Ladies Fitness Studio</Typography>
</Box>
);
}