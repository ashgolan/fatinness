// client/src/components/notifications/FcmTransferCard.jsx
import { useEffect, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import { Api } from "../../api/Api";
import { registerFcmToken } from "../../firebase/registerFcmToken";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../context/ThemeContext";
export default function FcmTransferCard({ onTransferred }) {

    const { mode } = useThemeMode();
    const isDark = mode === "dark";

    const textMain = isDark ? "#FFF" : "#111827";
    const textSub = isDark ? "#AAA" : "#6b7280";
    const cardBg = isDark ? "#232334" : "#FFFFFF";

    const { t } = useTranslation();

    const [checking, setChecking] = useState(true);
    const [ownedByCurrentUser, setOwnedByCurrentUser] = useState(true);
    const [transferring, setTransferring] = useState(false);
    useEffect(() => {
        if (localStorage.getItem("fcmTransferred") === "true") {
            setOwnedByCurrentUser(true);
            setChecking(false);
            return;
        }
        checkFcmOwnership();
    }, []);

    // ===============================
    // ▶ CHECK OWNERSHIP
    // ===============================
    const checkFcmOwnership = async () => {
        try {
            const token = await registerFcmToken({ silent: true });
            if (!token) {
                setOwnedByCurrentUser(false);
                return;
            }

            const { data } = await Api.post("/users/fcm/check", {
                fcmToken: token,
            });

            setOwnedByCurrentUser(data.ownedByCurrentUser === true);
        } catch {
            setOwnedByCurrentUser(false);
        } finally {
            setChecking(false);
        }
    };

    // ===============================
    // ▶ TRANSFER
    // ===============================
    const transfer = async () => {
        if (!window.confirm(t("profile.notifications.confirmTransfer"))) return;

        try {
            setTransferring(true);
            const token = await registerFcmToken({ silent: true });
            if (!token) throw new Error("NO_TOKEN");

            await Api.post("/users/fcm/transfer", { fcmToken: token });
            localStorage.setItem("fcmTransferred", "true");
            setOwnedByCurrentUser(true); // 👈 يخفي الكارد فورًا

            onTransferred?.(); // 🔥 callback اختياري
        } catch {
            alert(t("profile.notifications.transferFailed"));
        } finally {
            setTransferring(false);
        }
    };


    // لا نعرض شيئًا إن كان كل شيء سليم
    if (checking || ownedByCurrentUser) return null;

    return (
        <div
            style={{
                background: cardBg,
                borderRadius: "20px",
                padding: "20px",
                marginBottom: "32px",
                border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.05)",
                textAlign: "center",
            }}
        >
            <h3 style={{ color: textMain, marginBottom: "8px" }}>
                🔔 {t("profile.notifications.title")}
            </h3>

            <p style={{ color: textSub, fontSize: "14px", marginBottom: "16px" }}>
                {t("profile.notifications.description")}
            </p>

            <Button
                variant="contained"
                startIcon={!transferring && <SyncIcon />}
                disabled={transferring}
                onClick={transfer}
                sx={{
                    borderRadius: "14px",
                    px: 3,
                    py: 1.3,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                }}
            >
                {transferring ? (
                    <>
                        <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                        {t("profile.notifications.transferring")}
                    </>
                ) : (
                    t("profile.notifications.transferButton")
                )}
            </Button>
        </div>
    );
}
