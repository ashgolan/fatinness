// client/src/pages/admin/AdminWeightProgress.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Autocomplete,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Skeleton,
    Fade,
} from "@mui/material";

import { Api } from "../../api/Api";
import { useThemeMode } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Filler,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Filler,
    Legend
);

export default function AdminWeightProgress() {
    const { BRAND, mode } = useThemeMode();
    const { t, i18n } = useTranslation();
    const isDark = mode === "dark";

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [weightData, setWeightData] = useState([]);
    const [userMeta, setUserMeta] = useState(null);
    const [range, setRange] = useState("3m");
    const [loading, setLoading] = useState(false);

    // =========================
    // Fetch Users
    // =========================
    useEffect(() => {
        Api.get("/admin/users").then((res) => setUsers(res.data));
    }, []);

    // =========================
    // Fetch Weight Data
    // =========================
    useEffect(() => {
        if (!selectedUser) return;

        setLoading(true);

        Api.get(`/admin/users/${selectedUser._id}/weight-progress`)
            .then((res) => {
                setWeightData(res.data.history || []);
                setUserMeta({
                    height: res.data.height,
                    currentWeight: res.data.currentWeight,
                    username: res.data.username,
                });
            })
            .finally(() => setLoading(false));
    }, [selectedUser]);

    // =========================
    // Filter Range
    // =========================
    const filteredData = useMemo(() => {
        if (!weightData.length && !userMeta?.currentWeight) return [];

        const merged = [...weightData];

        if (
            userMeta?.currentWeight &&
            (!merged.length ||
                merged[merged.length - 1].weight !== userMeta.currentWeight)
        ) {
            merged.push({
                date: new Date(),
                weight: userMeta.currentWeight,
            });
        }

        if (range === "all") return merged;

        const now = new Date();
        let months = 3;
        if (range === "30d") months = 1;
        if (range === "6m") months = 6;
        if (range === "1y") months = 12;

        const cutoff = new Date();
        cutoff.setMonth(now.getMonth() - months);

        return merged.filter((d) => new Date(d.date) >= cutoff);
    }, [weightData, userMeta, range]);

    // =========================
    // Analytics
    // =========================
    const analytics = useMemo(() => {
        if (filteredData.length < 2) return null;

        const first = filteredData[0].weight;
        const last = filteredData[filteredData.length - 1].weight;
        const diff = Number((last - first).toFixed(1));

        const heightCm = userMeta?.height;
        const heightMeter = heightCm ? heightCm / 100 : null;

        const bmi =
            heightMeter && last
                ? (last / (heightMeter * heightMeter)).toFixed(1)
                : null;

        return { first, last, diff, bmi };
    }, [filteredData, userMeta]);
    const getBmiStatus = (bmi) => {
        if (!bmi) return null;

        const value = Number(bmi);

        if (value < 18.5) return "underweight";
        if (value < 25) return "normal";
        if (value < 30) return "overweight";
        return "obese";
    };
    const bmiStatus = analytics ? getBmiStatus(analytics.bmi) : null;
    // =========================
    // Chart Data
    // =========================
    const chartData = useMemo(() => {
        return {
            labels: filteredData.map((d) =>
                new Date(d.date).toLocaleDateString(i18n.language)
            ),
            datasets: [
                {
                    label: t("weightProgress.weight"),
                    data: filteredData.map((d) => ({
                        x: new Date(d.date).toLocaleDateString(i18n.language),
                        y: d.weight,
                        note: d.note || "",
                    })),
                    borderColor: BRAND.gold,
                    backgroundColor: "rgba(168,85,247,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: filteredData.map((d) => (d.note ? 8 : 5)),
                    pointHoverRadius: filteredData.map((d) => (d.note ? 12 : 8)),
                    pointBackgroundColor: filteredData.map((d) =>
                        d.note ? "#f97316" : BRAND.purple
                    ),
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                },
            ],
        };
    }, [filteredData, BRAND, i18n.language, t]);

    // =========================
    // Chart Options
    // =========================
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: { color: isDark ? "#eee" : "#555" },
            },
            tooltip: {
                backgroundColor: isDark ? "#1e293b" : "#fff",
                titleColor: BRAND.gold,
                bodyColor: isDark ? "#fff" : "#000",
                borderColor: BRAND.gold,
                borderWidth: 1,
                cornerRadius: 10,
                callbacks: {
                    label: function (context) {
                        const weight = context.raw.y;
                        const note = context.raw.note;
                        const formatted = formatWeight(weight);

                        if (note) {
                            return [
                                `${t("weightProgress.weight")}: ${formatted}`,
                                `${t("weightProgress.note")}: ${note}`,
                            ];
                        }
                        return `${t("weightProgress.weight")}: ${formatted}`;
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: isDark ? "#ccc" : "#555" },
                grid: { display: false },
            },
            y: {
                ticks: { color: isDark ? "#ccc" : "#555" },
                grid: {
                    color: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                },
            },
        },
    };

    // =========================
    // Weight Formatter
    // =========================
    const formatWeight = (value) => {
        if (value === null || value === undefined) return "";

        const formatted = Number(value).toLocaleString(i18n.language);

        if (i18n.language === "ar") return `${formatted} كغ`;
        if (i18n.language === "he") return `${formatted} ק״ג`;

        return `${formatted} kg`;
    };



    // =========================
    // UI
    // =========================
    return (
        <Box
            sx={{
                maxWidth: 1100,
                mx: "auto",
                mt: 4,
                pb: 6,
                px: 2,
                background: isDark
                    ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
                    : "linear-gradient(180deg,#fafafa,#ffffff)",
                borderRadius: 4,
            }}
        >
            <Typography
                variant="h5"
                textAlign="center"
                sx={{
                    fontWeight: 800,
                    mb: 4,
                    color: isDark ? BRAND.gold : BRAND.purple,
                }}
            >
                {t("weightProgress.title")}
            </Typography>

            <Paper
                sx={{
                    p: { xs: 2, sm: 4 },
                    borderRadius: 4,
                    background: isDark ? BRAND.paperDark : "#fff",
                }}
            >
                <Autocomplete
                    options={users}
                    getOptionLabel={(o) => o?.username ?? ""}
                    onChange={(e, val) => setSelectedUser(val)}
                    renderInput={(params) => (
                        <TextField {...params} label={t("weightProgress.select")} />
                    )}
                    sx={{ mb: 3 }}
                />
                {!selectedUser && (
                    <Fade in timeout={600}>
                        <Box
                            sx={{
                                mt: 3,
                                height: { xs: 260, sm: 320, md: 360 },
                                borderRadius: 4,
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                textAlign: "center",
                                px: 2,
                                background: isDark
                                    ? "linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))"
                                    : "linear-gradient(145deg, #fff7ed, #faf5ff, #ffffff)",
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                    }`,
                            }}
                        >
                            {/* Glow Gold */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    width: 340,
                                    height: 340,
                                    borderRadius: "50%",
                                    top: -140,
                                    right: -140,
                                    background: `radial-gradient(circle, ${BRAND.gold}55, transparent 70%)`,
                                    filter: "blur(2px)",
                                    opacity: 0.9,
                                }}
                            />

                            {/* Glow Purple */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    width: 280,
                                    height: 280,
                                    borderRadius: "50%",
                                    bottom: -140,
                                    left: -140,
                                    background: `radial-gradient(circle, ${BRAND.purple}40, transparent 70%)`,
                                    filter: "blur(2px)",
                                    opacity: 0.9,
                                }}
                            />

                            {/* Soft chart line */}
                            <Box
                                component="svg"
                                viewBox="0 0 600 220"
                                sx={{
                                    position: "absolute",
                                    bottom: -10,
                                    left: 0,
                                    width: "100%",
                                    opacity: isDark ? 0.12 : 0.10,
                                }}
                            >
                                <polyline
                                    fill="none"
                                    stroke={BRAND.purple}
                                    strokeWidth="5"
                                    points="0,160 120,140 220,180 330,120 450,150 600,90"
                                />
                                <polyline
                                    fill="none"
                                    stroke={BRAND.gold}
                                    strokeWidth="4"
                                    opacity="0.8"
                                    points="0,185 120,170 220,195 330,150 450,175 600,120"
                                />
                            </Box>

                            {/* Big icon watermark */}
                            <Typography
                                sx={{
                                    position: "absolute",
                                    fontSize: { xs: 120, sm: 150, md: 170 },
                                    fontWeight: 900,
                                    opacity: isDark ? 0.06 : 0.05,
                                    color: BRAND.gold,
                                    userSelect: "none",
                                }}
                            >
                                ⚖
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 800,
                                    color: isDark ? "#fff" : "#111",
                                    zIndex: 2,
                                }}
                            >
                                {t("weightProgress.selectPrompt")}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    opacity: 0.75,
                                    color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
                                    zIndex: 2,
                                    maxWidth: 520,
                                }}
                            >
                                {t("weightProgress.selectHint")}
                            </Typography>
                        </Box>
                    </Fade>
                )}
                {selectedUser && (
                    <>
                        <ToggleButtonGroup
                            value={range}
                            exclusive
                            fullWidth
                            onChange={(e, val) => val && setRange(val)}
                            size="small"
                            sx={{
                                mb: 4,
                                "& .Mui-selected": {
                                    backgroundColor: BRAND.gold,
                                    color: "#000",
                                },
                            }}
                        >
                            <ToggleButton value="30d">30D</ToggleButton>
                            <ToggleButton value="3m">3M</ToggleButton>
                            <ToggleButton value="6m">6M</ToggleButton>
                            <ToggleButton value="1y">1Y</ToggleButton>
                            <ToggleButton value="all">
                                {t("weightProgress.all")}
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {analytics && (
                            <Box textAlign="center" mb={5}>
                                <Typography
                                    sx={{
                                        fontSize: {
                                            xs: "42px",
                                            sm: "56px",
                                            md: "64px",
                                        },
                                        fontWeight: 900,
                                        background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.purple})`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    {formatWeight(analytics.last)}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                                    {t("weightProgress.current")}
                                </Typography>
                            </Box>
                        )}

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                mb: 2,
                                color: isDark ? BRAND.gold : BRAND.purple,
                            }}
                        >
                            {t("weightProgress.chartTitle")}
                        </Typography>

                        {loading ? (
                            <Skeleton variant="rectangular" height={300} />
                        ) : (
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    height: { xs: 260, sm: 320, md: 400 },
                                    background: isDark ? BRAND.paperDark : "#fff",
                                }}
                            >
                                <Line data={chartData} options={chartOptions} />
                            </Paper>
                        )}
                    </>
                )}
            </Paper>

            {analytics && (
                <Fade in timeout={500}>
                    <Box
                        sx={{
                            mt: 4,
                            px: { xs: 1, sm: 2 },
                            py: 2.5,
                            borderRadius: 3,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                            background: isDark
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                                }`,
                        }}
                    >
                        {/* BMI */}
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                {t("weightProgress.bmi")}
                            </Typography>

                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: BRAND.gold,
                                }}
                            >
                                {analytics.bmi ?? "-"}
                            </Typography>

                            {bmiStatus && (
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        mt: 0.5,
                                        fontWeight: 600,
                                        color:
                                            bmiStatus === "normal"
                                                ? "#22c55e"
                                                : bmiStatus === "underweight"
                                                    ? "#3b82f6"
                                                    : bmiStatus === "overweight"
                                                        ? "#f59e0b"
                                                        : "#ef4444",
                                    }}
                                >
                                    {t(`weightProgress.bmiStatus.${bmiStatus}`)}
                                </Typography>
                            )}
                        </Box>

                        {/* Divider */}
                        <Box
                            sx={{
                                width: 1,
                                height: 28,
                                background: isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                        />

                        {/* Change */}
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                {t("weightProgress.change")}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color:
                                        analytics.diff < 0
                                            ? "#22c55e"
                                            : analytics.diff > 0
                                                ? "#ef4444"
                                                : BRAND.purple,
                                }}
                            >
                                {formatWeight(analytics.diff)}
                            </Typography>
                        </Box>

                        {/* Divider */}
                        <Box
                            sx={{
                                width: 1,
                                height: 28,
                                background: isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                        />

                        {/* Start */}
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                {t("weightProgress.start")}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: BRAND.purple,
                                }}
                            >
                                {formatWeight(analytics.first)}
                            </Typography>
                        </Box>
                    </Box>
                </Fade>
            )}
        </Box>
    );
}