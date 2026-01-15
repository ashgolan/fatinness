// client/src/components/notifications/FcmTransferCard.jsx
import { useEffect, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import { Api } from "../../api/Api";
import { registerFcmToken } from "../../firebase/registerFcmToken";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../context/ThemeContext";
import { toast } from "react-toastify";

export default function FcmTransferCard() {
    const { t } = useTranslation();
    const { mode } = useThemeMode();
    const isDark = mode === "dark";

    const textMain = isDark ? "#FFF" : "#111827";
    const textSub = isDark ? "#AAA" : "#6b7280";
    const cardBg = isDark ? "#232334" : "#FFFFFF";

    const [transferring, setTransferring] = useState(false);
    const [fcmStatus, setFcmStatus] = useState({
        checked: false,
        ownedByCurrentUser: true,
    });

    // ===== نفس دالة البروفايل =====
    const checkFcmOwnership = async (forcedToken) => {
        try {
            const token = forcedToken || await registerFcmToken({ silent: true });
            if (!token) {
                setFcmStatus({ checked: true, ownedByCurrentUser: false });
                return;
            }

            const { data } = await Api.post("/users/fcm/check", {
                fcmToken: token,
            });

            setFcmStatus({
                checked: true,
                ownedByCurrentUser: data.ownedByCurrentUser === true,
            });
        } catch {
            setFcmStatus({ checked: true, ownedByCurrentUser: false });
        }
    };


    // ===== نفس دالة النقل =====
    const transferFcmToThisDevice = async () => {
        try {
            setTransferring(true);

            const token = await registerFcmToken({ silent: true });
            if (!token) throw new Error("NO_TOKEN");

            await Api.post("/users/fcm/transfer", { fcmToken: token });

            toast.success(t("profile.notifications.transferredSuccess"));

            // 🔥 المهم
            await checkFcmOwnership(token);
        } catch {
            toast.error(t("profile.notifications.transferFailed"));
        } finally {
            setTransferring(false);
        }
    };


    useEffect(() => {
        checkFcmOwnership();
    }, []);

    // لا نعرض شيئًا إذا لا توجد مشكلة
    if (!fcmStatus.checked || fcmStatus.ownedByCurrentUser) return null;

    return (
        <div
            style={{
                background: cardBg,
                borderRadius: "20px",
                padding: "20px",
                marginBottom: "24px",
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
                onClick={() => {
                    if (!window.confirm(t("profile.notifications.confirmTransfer")))
                        return;
                    transferFcmToThisDevice();
                }}
                sx={{
                    borderRadius: "14px",
                    px: 3,
                    py: 1.3,
                    fontWeight: 600,
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
