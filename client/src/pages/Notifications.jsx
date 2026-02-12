import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Divider,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Fade,
    Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function Notifications() {
    const { t, i18n } = useTranslation();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // =========================
    // 📥 Fetch
    // =========================
    const fetchNotifications = async () => {
        try {
            const { data } = await Api.get("/notifications");
            setNotifications(data);
            window.dispatchEvent(new Event("refresh-unread-count"));
        } catch {
            toast.error(t("notificationsPage.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const handleNewNotification = () => {
            fetchNotifications();
        };

        const handleForceRefresh = () => {
            fetchNotifications();
        };

        window.addEventListener("fcm-foreground-message", handleNewNotification);
        window.addEventListener("force-notifications-refresh", handleForceRefresh);

        return () => {
            window.removeEventListener("fcm-foreground-message", handleNewNotification);
            window.removeEventListener("force-notifications-refresh", handleForceRefresh);
        };
    }, []);

    // =========================
    // 📊 Counts
    // =========================
    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications]
    );

    const readCount = notifications.length - unreadCount;

    // =========================
    // 🎯 Filtered list
    // =========================
    const filteredNotifications = useMemo(() => {
        if (filter === "unread")
            return notifications.filter((n) => !n.isRead);
        if (filter === "read")
            return notifications.filter((n) => n.isRead);
        return notifications;
    }, [filter, notifications]);

    // =========================
    // ✅ Mark single
    // =========================
    const markAsRead = async (id) => {
        try {
            await Api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                )
            );
            window.dispatchEvent(new Event("refresh-unread-count"));
        } catch {
            toast.error(t("notifications.updateError"));
        }
    };

    // =========================
    // 📭 Mark all
    // =========================
    const markAllAsRead = async () => {
        try {
            await Api.put("/notifications/read-all");
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            window.dispatchEvent(new Event("refresh-unread-count"));
            toast.success(t("notificationsPage.allMarked"));
        } catch {
            toast.error(t("notificationsPage.updateAllError"));
        }
    };

    // =========================
    // ⏳ Loader
    // =========================
    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }
    return (
        <Box
            dir={i18n.dir()}
            sx={{
                maxWidth: 850,
                mx: "auto",
                mt: 4,
                px: 2,
            }}
        >
            {/* ================= HEADER ================= */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontWeight: 800,
                    }}
                >
                    <NotificationsIcon />
                    {t("notificationsPage.title")}
                    {unreadCount > 0 && (
                        <Chip
                            label={unreadCount}
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title={t("notificationsPage.refresh")}>
                        <IconButton onClick={fetchNotifications}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    {unreadCount > 0 && (
                        <Tooltip title={t("notificationsPage.markAll")}>
                            <IconButton onClick={markAllAsRead}>
                                <MarkEmailReadIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* ================= FILTER ================= */}
            <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={(e, val) => val && setFilter(val)}
                sx={{ mb: 3 }}
            >
                <ToggleButton value="all">
                    {t("notificationsPage.filterAll")} ({notifications.length})
                </ToggleButton>
                <ToggleButton value="unread">
                    {t("notificationsPage.filterUnread")} ({unreadCount})
                </ToggleButton>
                <ToggleButton value="read">
                    {t("notificationsPage.filterRead")} ({readCount})
                </ToggleButton>
            </ToggleButtonGroup>

            {/* ================= EMPTY ================= */}
            {filteredNotifications.length === 0 && (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: "center",
                        opacity: 0.7,
                    }}
                >
                    {t("notificationsPage.empty")}
                </Paper>
            )}

            {/* ================= LIST ================= */}
            {filteredNotifications.map((n) => {
                const typeStyles = {
                    system: {
                        color: "#9c27b0",
                        label: t("notificationsPage.types.system"),
                    },
                    admin: {
                        color: "#1976d2",
                        label: t("notificationsPage.types.admin"),
                    },
                    security: {
                        color: "#d32f2f",
                        label: t("notificationsPage.types.security"),
                    },
                };

                const currentType = typeStyles[n.type] || typeStyles.system;

                return (
                    <Fade in key={n._id}>
                        <Paper
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            sx={{
                                p: 2.5,
                                mb: 2,
                                cursor: "pointer",
                                backgroundColor: "background.paper",
                                borderInlineStart: `4px solid ${currentType.color}`,
                                borderRadius: 3,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: 4,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    mb: 1,
                                }}
                            >
                                <Typography fontWeight={700}>
                                    {n.title}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    {/* نوع الإشعار */}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: currentType.color,
                                            fontWeight: 700,
                                            position: "relative",
                                            pb: 0.5,
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: "2px",
                                                backgroundColor: currentType.color,
                                                borderRadius: "2px",
                                            },
                                        }}
                                    >
                                        {currentType.label}
                                    </Typography>

                                    {!n.isRead && (
                                        <Chip
                                            label={t("notificationsPage.new")}
                                            size="small"
                                            color="primary"
                                            sx={{ mt: 0.5 }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            <Typography
                                variant="body2"
                                sx={{ mb: 1, opacity: 0.85 }}
                            >
                                {n.body}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {new Date(n.createdAt).toLocaleString(
                                    i18n.language === "he"
                                        ? "he-IL"
                                        : i18n.language === "en"
                                            ? "en-US"
                                            : "ar-EG"
                                )}
                            </Typography>
                        </Paper>
                    </Fade>
                );
            })}
        </Box>
    );
}
