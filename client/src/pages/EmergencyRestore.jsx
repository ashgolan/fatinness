import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "/api";

const LABELS = {
  users:             "משתמשים / Users",
  bookings:          "הזמנות / Bookings",
  slots:             "שיעורים / Slots",
  settings:          "הגדרות / Settings",
  notifications:     "התראות / Notifications",
  userNotifications: "התראות משתמש / User Notifications",
  weekTemplates:     "תבניות שבועיות / Week Templates",
  payments:          "תשלומים / Payments",
  galleryImages:     "גלריה / Gallery",
};

export default function EmergencyRestore() {
  const [step, setStep]           = useState(1);
  const [key, setKey]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [backupFile, setBackupFile] = useState(null);
  const [backupInfo, setBackupInfo] = useState(null);
  const [results, setResults]     = useState(null);
  const fileRef = useRef(null);

  // ── Step 1: verify key ─────────────────────────────────────
  const handleCheckKey = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await axios.post(`${BASE_URL}/emergency/check`, { emergencyKey: key });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "مفتاح غير صحيح / מפתח שגוי");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: file upload ────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("يجب اختيار ملف ZIP فقط / יש לבחור קובץ ZIP בלבד");
      return;
    }

    setBackupFile(file);
    setBackupInfo({
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
    });
  };

  // ── Step 2: restore ────────────────────────────────────────
  const handleRestore = async () => {
    if (!backupFile) return;
    if (!window.confirm("⚠️ هذه العملية ستستعيد جميع البيانات. هل أنت متأكد؟\n⚠️ פעולה זו תשחזר את כל הנתונים. האם אתה בטוח?")) return;

    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", backupFile);
      formData.append("emergencyKey", key);

      const res = await axios.post(`${BASE_URL}/emergency/restore`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResults(res.data.restored);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "خطأ في الاستعادة / שגיאה בשחזור");
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────
  const card = {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    padding: 28,
    border: "1px solid rgba(255,255,255,0.13)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, fontSize: 14, color: "#fff",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const btnRed = {
    padding: "12px", background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };

  const btnGreen = {
    padding: "12px", background: "linear-gradient(135deg,#059669,#047857)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };

  const errBox = {
    background: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8, padding: "10px 14px",
    fontSize: 13, color: "#fca5a5",
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Tajawal','Assistant',Arial,sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px",
          }}>🚨</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
            Emergency Restore
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            Fatinness Studio — استعادة الطوارئ
          </p>
        </div>

        {/* ── STEP 1: Key ── */}
        {step === 1 && (
          <div style={card}>
            <div style={{
              background: "rgba(239,68,68,0.13)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: "#fca5a5",
            }}>
              ⚠️ هذه الصفحة مخصصة لاستعادة الطوارئ فقط. تتطلب مفتاح سري.
            </div>

            <form onSubmit={handleCheckKey} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
                  مفتاح الطوارئ / Emergency Key
                </label>
                <input
                  type="password" value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="أدخل المفتاح السري..."
                  required style={inputStyle}
                />
              </div>
              {error && <div style={errBox}>{error}</div>}
              <button type="submit" disabled={loading} style={btnRed}>
                {loading ? "جارٍ التحقق..." : "متابعة ←"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 4 }}>
              <a href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
                ← العودة للرئيسية
              </a>
            </div>
          </div>
        )}

        {/* ── STEP 2: Upload & Restore ── */}
        {step === 2 && (
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7" }}>
              ✅ مفتاح صحيح — اختر ملف النسخة الاحتياطية
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              ملف ZIP فقط (fatinness-backup-*.zip)
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${backupFile ? "rgba(6,150,105,0.6)" : "rgba(255,255,255,0.25)"}`,
                borderRadius: 12, padding: "28px 16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                cursor: "pointer",
                background: backupFile ? "rgba(5,150,105,0.08)" : "rgba(255,255,255,0.04)",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 36 }}>{backupFile ? "✅" : "📦"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
                {backupFile
                  ? `${backupInfo?.fileName} — انقر للتغيير`
                  : "انقر لاختيار ملف ZIP"}
              </div>
              {backupInfo?.fileSize && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  الحجم: {backupInfo.fileSize}
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".zip" style={{ display: "none" }} onChange={handleFileUpload} />

            {error && <div style={errBox}>{error}</div>}

            {backupFile && (
              <>
                <div style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 10, padding: "12px 16px",
                  fontSize: 12, color: "#fca5a5",
                }}>
                  ⚠️ تحذير: ستُحذف البيانات الحالية واستبدالها بمحتوى النسخة الاحتياطية.
                </div>
                <button onClick={handleRestore} disabled={loading} style={btnGreen}>
                  {loading ? "جارٍ الاستعادة..." : "🔄 استعادة البيانات الآن"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 3 && (
          <div style={{
            ...card,
            border: "1px solid rgba(5,150,105,0.4)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#6ee7b7" }}>
              تمت الاستعادة بنجاح!
            </div>

            {/* Results grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, textAlign: "right" }}>
              {Object.entries(results || {}).map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 12, color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 6, padding: "6px 10px",
                }}>
                  <span>{LABELS[k] || k}</span>
                  <strong style={{ color: "#6ee7b7" }}>+{v}</strong>
                </div>
              ))}
            </div>

            <a href="/login" style={{
              padding: "12px",
              background: "linear-gradient(135deg,#9B6FD6,#7C3AED)",
              color: "#fff", borderRadius: 10, fontSize: 14,
              fontWeight: 600, textDecoration: "none", display: "block",
            }}>
              → الدخول للنظام
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
