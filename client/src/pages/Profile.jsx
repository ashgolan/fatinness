// // client/src/pages/Profile.jsx
// import React, { useEffect, useState } from "react";
// import { Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";
// import { Api } from "../api/Api";
// import { toast } from "react-toastify";
// import { useThemeMode } from "../context/ThemeContext";
// import { useTranslation } from "react-i18next";
// import useServerError from "../hooks/useServerError";
// // import { registerFcmToken } from "../firebase/registerFcmToken";
// import { Button, CircularProgress } from "@mui/material";
// // import SyncIcon from "@mui/icons-material/Sync";
// ChartJS.register(
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
//   Filler
// );

// export default function Profile() {
//   const handleServerError = useServerError();
//   const { t, i18n } = useTranslation();

//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [newWeight, setNewWeight] = useState("");
//   const [note, setNote] = useState("");
//   const [saving, setSaving] = useState(false);
//   // const [transferring, setTransferring] = useState(false);

//   const { mode } = useThemeMode();
//   const isDark = mode === "dark";

//   const [openAddWeight, setOpenAddWeight] = useState(false);


//   const [openEditProfileInfo, setOpenEditProfileInfo] = useState(false);
//   const [editHeight, setEditHeight] = useState("");
//   const [editAge, setEditAge] = useState("");
//   const [savingProfileInfo, setSavingProfileInfo] = useState(false);
//   // const [fcmStatus, setFcmStatus] = useState({
//   //   checked: false,
//   //   ownedByCurrentUser: true,
//   // });

//   const [bmiIndicator, setBmiIndicator] = useState(0);



//   // const checkFcmOwnership = async () => {
//   //   try {
//   //     const token = await registerFcmToken({ silent: true });
//   //     if (!token) {
//   //       setFcmStatus({ checked: true, ownedByCurrentUser: false });
//   //       return;
//   //     }

//   //     const { data } = await Api.post("/users/fcm/check", {
//   //       fcmToken: token,
//   //     });

//   //     setFcmStatus({
//   //       checked: true,
//   //       ownedByCurrentUser: data.ownedByCurrentUser === true,
//   //     });
//   //   } catch (err) {
//   //     console.error(err);
//   //     setFcmStatus({ checked: true, ownedByCurrentUser: false });
//   //   }
//   // };

//   // async function transferFcmToThisDevice() {
//   //   try {
//   //     setTransferring(true);

//   //     const token = await registerFcmToken({ silent: true });
//   //     if (!token) throw new Error("NO_TOKEN");

//   //     await Api.post("/users/fcm/transfer", { fcmToken: token });

//   //     // ❌ لا toast هنا
//   //   } catch (err) {
//   //     console.error(err);
//   //     throw err;
//   //   } finally {
//   //     setTransferring(false);
//   //   }
//   // }

//   const fetchProfile = async () => {
//     setLoading(true);
//     try {
//       const { data } = await Api.get("/users/me");
//       setUser(data);
//     } catch (err) {
//       handleServerError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   useEffect(() => {
//     if (user) {
//       setEditHeight(user.height || "");
//       setEditAge(user.age || "");
//     }
//   }, [user]);
//   const handleAddWeight = async () => {
//     if (!newWeight) return toast.warning(t("profile.errors.weightRequired"));

//     setSaving(true);
//     try {
//       await Api.post("/users/me/weight", {
//         weight: parseFloat(newWeight),
//         note,
//       });
//       toast.success(t("profile.messages.weightSaved"));
//       setNewWeight("");
//       setNote("");
//       fetchProfile();
//     } catch (err) {
//       handleServerError(err);
//     } finally {
//       setSaving(false);
//     }
//   };


//   const handleSaveProfileInfo = async () => {
//     if (!editHeight || !editAge) {
//       return toast.warning("Please fill in height and age");
//     }

//     setSavingProfileInfo(true);
//     try {
//       await Api.put("/users/me", {
//         height: Number(editHeight),
//         age: Number(editAge),
//       });

//       toast.success("Profile info updated successfully");
//       setOpenEditProfileInfo(false);
//       fetchProfile();
//     } catch (err) {
//       handleServerError(err);
//     } finally {
//       setSavingProfileInfo(false);
//     }
//   };
//   // ===============================
//   // ▶ BMI CALCULATIONS
//   // ===============================
//   const heightM = user?.height ? user.height / 100 : 0;
//   const bmi =
//     user?.weight && heightM
//       ? (user.weight / (heightM * heightM)).toFixed(1)
//       : null;

//   let bmiStatus = "";
//   let bmiColor = "";

//   if (bmi) {
//     if (bmi < 18.5) {
//       bmiStatus = t("profile.bmi.underweight");
//       bmiColor = "#3b82f6"; // blue
//     } else if (bmi < 25) {
//       bmiStatus = t("profile.bmi.normal");
//       bmiColor = "#22c55e"; // green
//     } else if (bmi < 30) {
//       bmiStatus = t("profile.bmi.overweight");
//       bmiColor = "#eab308"; // yellow
//     } else {
//       bmiStatus = t("profile.bmi.obese");
//       bmiColor = "#ef4444"; // red
//     }
//   }

//   const idealMin = user?.height ? (18.5 * heightM * heightM).toFixed(1) : null;
//   const idealMax = user?.height ? (24.9 * heightM * heightM).toFixed(1) : null;

//   // ===============================
//   // ▶ BMI SCALE HELPERS
//   // ===============================

//   // ===============================
//   // ▶ BMI SCALE HELPERS
//   // ===============================
//   const getBmiPercent = (bmi) => {
//     const min = 15;
//     const max = 40;
//     const clamped = Math.min(Math.max(bmi, min), max);
//     return ((clamped - min) / (max - min)) * 100;
//   };

//   // ✅ حركة المؤشر (مضمونة)
//   useEffect(() => {
//     if (!bmi) return;

//     const percent = getBmiPercent(Number(bmi));

//     // 1) رجعه للصفر
//     setBmiIndicator(0);

//     // 2) فريم أول ثم فريم ثاني => transition يشتغل أكيد
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         setBmiIndicator(percent);
//       });
//     });
//   }, [bmi]);

//   // ===============================
//   // ▶ CHART DATA
//   // ===============================
//   const weightHistory = user?.weightHistory || [];

//   const chartData = {
//     labels: weightHistory.map((w) =>
//       new Date(w.date).toLocaleDateString(
//         i18n.language === "ar"
//           ? "ar-EG"
//           : i18n.language === "he"
//             ? "he-IL"
//             : "en-US",
//         { month: "short", day: "numeric" }
//       )
//     ),
//     datasets: [
//       {
//         label: t("profile.chart.label"),
//         data: weightHistory.map((w) => w.weight),
//         fill: true,
//         backgroundColor: (context) => {
//           const ctx = context.chart.ctx;
//           const gradient = ctx.createLinearGradient(0, 0, 0, 300);
//           gradient.addColorStop(
//             0,
//             isDark ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)"
//           );
//           gradient.addColorStop(1, "rgba(0,0,0,0)");
//           return gradient;
//         },
//         borderColor: isDark ? "#C084FC" : "#6366f1",
//         borderWidth: 3,
//         pointBackgroundColor: isDark ? "#C084FC" : "#6366f1",
//         pointBorderColor: "#fff",
//         pointBorderWidth: 2,
//         pointRadius: 5,
//         pointHoverRadius: 7,
//         tension: 0.4,
//       },
//     ],
//   };

//   const textMain = isDark ? "#FFF" : "#111827";
//   const textSub = isDark ? "#AAA" : "#6b7280";
//   const cardBg = isDark ? "#232334" : "#FFFFFF";

//   // ===============================
//   // ▶ PAGE LAYOUT
//   // ===============================
//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: {
//       mode: "nearest",
//       intersect: true,
//     },
//     plugins: {
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         enabled: true,
//         callbacks: {
//           // العنوان (التاريخ)
//           title: (items) => {
//             const index = items[0].dataIndex;
//             const w = weightHistory[index];
//             return new Date(w.date).toLocaleDateString(
//               i18n.language === "ar"
//                 ? "ar-EG"
//                 : i18n.language === "he"
//                   ? "he-IL"
//                   : "en-US",
//               {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               }
//             );
//           },

//           // السطر الرئيسي (الوزن)
//           label: (item) => {
//             const w = weightHistory[item.dataIndex];
//             return `${t("profile.chart.weight")}: ${w.weight} ${t(
//               "profile.units.kg"
//             )}`;
//           },

//           // سطر إضافي: السبب / الملاحظة
//           afterLabel: (item) => {
//             const w = weightHistory[item.dataIndex];
//             return w.note
//               ? `${t("profile.chart.note")}: ${w.note}`
//               : t("profile.chart.noNote");
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         ticks: {
//           color: isDark ? "#ccc" : "#444",
//         },
//       },
//       y: {
//         ticks: {
//           color: isDark ? "#ccc" : "#444",
//         },
//       },
//     },
//   };



//   return (

//     <div
//       style={{
//         minHeight: "100vh",
//         background: isDark
//           ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
//           : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
//         dir: i18n.language === "ar" ? "rtl" : "ltr",
//       }}
//     >
//       <div
//         style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
//       >

//         {/* ===============================
//     FCM DEBUG INFO (TOP)
// =============================== */}


//         {/* ===============================
//             HEADER
//         =============================== */}
//         <div
//           style={{
//             padding: "20px",
//             borderRadius: "20px",
//             background: isDark
//               ? "linear-gradient(135deg, #312E81, #5B21B6, #831843)"
//               : "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
//             color: "#fff",
//             marginBottom: "20px",
//             display: "flex",
//             alignItems: "center",
//             gap: "16px",
//           }}
//         >
//           <div
//             style={{
//               width: "56px",
//               height: "56px",
//               borderRadius: "50%",
//               background: "rgba(255,255,255,0.25)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               fontSize: "22px",
//               fontWeight: 700,
//             }}
//           >
//             {user?.username?.charAt(0) || "U"}
//           </div>

//           <div>
//             <h2 style={{ margin: 0, fontSize: "20px" }}>
//               {user?.username || t("profile.labels.user")}
//             </h2>
//             <p style={{ margin: 0, opacity: 0.85, fontSize: "13px" }}>
//               {user?.email}
//             </p>
//           </div>
//         </div>


//         {/* ===============================
//             BMI SECTION (OPTION 4)
//         =============================== */}
//         {bmi && (
//           <div
//             style={{
//               background: cardBg,
//               borderRadius: "24px",
//               padding: "28px",
//               marginBottom: "32px",
//               boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
//             }}
//           >
//             <h2 style={{ marginBottom: "16px", color: textMain }}>
//               {t("profile.bmi.title")}
//             </h2>

//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "16px",
//                 padding: "16px",
//                 borderRadius: "16px",
//                 background: bmiColor + "22",
//                 border: `2px solid ${bmiColor}`,
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "40px",
//                   fontWeight: 800,
//                   color: bmiColor,
//                   minWidth: "80px",
//                   textAlign: "center",
//                 }}
//               >
//                 {bmi}
//               </div>

//               <div>
//                 <p style={{ margin: 0, fontWeight: 600, color: bmiColor }}>
//                   {bmiStatus}
//                 </p>
//                 <p style={{ margin: 0, fontSize: "13px", color: textSub }}>
//                   {t("profile.bmi.idealWeight")}: {idealMin}–{idealMax}{" "}
//                   {t("profile.units.kg")}
//                 </p>
//               </div>
//             </div>
//             {/* ===============================
//     BMI VISUAL SCALE
// =============================== */}
//             <div style={{ marginTop: "24px" }}>
//               <div
//                 style={{
//                   position: "relative",
//                   height: "14px",
//                   borderRadius: "999px",
//                   overflow: "hidden",
//                   background:
//                     "linear-gradient(to right, #3b82f6 0%, #22c55e 40%, #22c55e 62%, #eab308 75%, #ef4444 100%)",
//                 }}
//               >
//                 {/* Indicator */}
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: "-6px",
//                     left: `${bmiIndicator}%`,
//                     transition: "left 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
//                     willChange: "left",
//                     transform: "translateX(-50%)",
//                     width: "0",
//                     height: "0",
//                     borderLeft: "6px solid transparent",
//                     borderRight: "6px solid transparent",
//                     borderTop: `10px solid ${bmiColor}`,
//                   }}
//                 />
//               </div>

//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "11px",
//                   color: textSub,
//                   marginTop: "6px",
//                 }}
//               >
//                 <span>18.5</span>
//                 <span>24.9</span>
//                 <span>30+</span>
//               </div>
//             </div>

//             <p style={{ color: textSub }}>
//               {t("profile.bmi.healthyRange")}: <strong>18.5 – 24.9</strong>
//             </p>

//             {idealMin && idealMax && (
//               <p style={{ color: textSub }}>
//                 {t("profile.bmi.idealWeight")}:{" "}
//                 <strong>
//                   {idealMin}–{idealMax} {t("profile.units.kg")}
//                 </strong>
//               </p>
//             )}
//           </div>
//         )}

//         {/* ===============================
//             OTHER STATS (GRID)
//         =============================== */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
//             gap: "24px",
//             marginBottom: "32px",
//           }}
//         >
//           {/* وزن / طول / اشتراك ... */}
//           {[
//             {
//               icon: "🎂",
//               label: "Age",
//               value: user?.age ? user.age : "-",
//             },
//             {
//               icon: "⚖️",
//               label: t("profile.stats.currentWeight"),
//               value: user?.weight
//                 ? `${user.weight} ${t("profile.units.kg")}`
//                 : "-",
//             },
//             {
//               icon: "📏",
//               label: t("profile.stats.height"),
//               value: user?.height
//                 ? `${user.height} ${t("profile.units.cm")}`
//                 : "-",
//             },
//             {
//               icon: "🏋️",
//               label: t("profile.stats.completed"),
//               value: user?.stats?.completedBookings || 0,
//             },
//           ].map((stat) => (
//             <div
//               key={stat.label}
//               style={{
//                 background: cardBg,
//                 padding: "14px",
//                 borderRadius: "14px",
//                 textAlign: "center",
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//               }}
//             >
//               <div style={{ fontSize: "28px" }}>{stat.icon}</div>
//               <p style={{ color: textSub, fontSize: "12px" }}>{stat.label}</p>
//               <h3 style={{ color: textMain, margin: 0 }}>{stat.value}</h3>
//             </div>
//           ))}
//         </div>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             marginBottom: "24px",
//           }}
//         >
//           <button
//             onClick={() => setOpenEditProfileInfo(true)}
//             style={{
//               border: "none",
//               borderRadius: "14px",
//               padding: "12px 20px",
//               background: "linear-gradient(135deg, #6366f1, #a855f7)",
//               color: "#fff",
//               fontWeight: 700,
//               fontSize: "15px",
//               cursor: "pointer",
//               boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
//             }}
//           >
//             Edit Profile Info
//           </button>
//         </div>
//         {/* ===============================
//     TRANSFER NOTIFICATIONS
// =============================== */}

//         {/* {fcmStatus.checked && !fcmStatus.ownedByCurrentUser && (
//           <div
//             style={{
//               background: cardBg,
//               borderRadius: "20px",
//               padding: "20px",
//               marginBottom: "32px",
//               border: isDark
//                 ? "1px solid rgba(255,255,255,0.08)"
//                 : "1px solid rgba(0,0,0,0.05)",
//               textAlign: "center",
//             }}
//           >
//             <h3 style={{ color: textMain, marginBottom: "8px" }}>
//               🔔 {t("profile.notifications.title")}
//             </h3>
//             <p
//               style={{ color: textSub, fontSize: "14px", marginBottom: "16px" }}
//             >
//               {t("profile.notifications.description")}
//             </p>

//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={!transferring && <SyncIcon />}
//               disabled={transferring}
//               onClick={async () => {
//                 if (!window.confirm(t("profile.notifications.confirmTransfer")))
//                   return;

//                 setTransferring(true);
//                 try {
//                   await transferFcmToThisDevice();
//                   await fetchProfile();
//                   await checkFcmOwnership(); // 🔥 هذا هو السطر المهم
//                   toast.success(t("profile.notifications.transferredSuccess"));

//                 } catch {
//                   toast.error(t("profile.notifications.transferFailed"));
//                 } finally {
//                   setTransferring(false);
//                 }
//               }}
//               sx={{
//                 borderRadius: "14px",
//                 px: 3,
//                 py: 1.3,
//                 fontWeight: 600,
//                 fontSize: "0.95rem",
//                 textTransform: "none",
//                 boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
//               }}
//             >
//               {transferring ? (
//                 <>
//                   <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
//                   {t("profile.notifications.transferring")}
//                 </>
//               ) : (
//                 t("profile.notifications.transferButton")
//               )}
//             </Button>
//           </div>
//         )} */}
//         {/* ===============================
//             CHART
//         =============================== */}
//         <div
//           style={{
//             background: cardBg,
//             borderRadius: "24px",
//             padding: "24px",
//             marginBottom: "32px",
//           }}
//         >
//           <h2>{t("profile.sections.weightProgress")}</h2>

//           {weightHistory.length > 0 ? (
//             <div
//               style={{
//                 width: "100%",
//                 height: window.innerWidth < 600 ? "200px" : "320px",
//                 position: "relative",
//               }}
//             >
//               <Line data={chartData} options={chartOptions} />
//             </div>
//           ) : (
//             <p
//               style={{ textAlign: "center", color: textSub, padding: "24px 0" }}
//             >
//               {t("profile.messages.noWeightData")}
//             </p>
//           )}
//         </div>

//       </div>
//       <button
//         onClick={() => setOpenAddWeight(true)}
//         style={{
//           position: "fixed",
//           bottom: "60px",
//           right: i18n.language === "ar" ? "auto" : "24px",
//           left: i18n.language === "ar" ? "24px" : "auto",
//           width: "64px",
//           height: "64px",
//           borderRadius: "50%",
//           border: "none",
//           background: "linear-gradient(135deg, #a855f7, #6366f1)",
//           color: "#fff",
//           fontSize: "36px",
//           cursor: "pointer",
//           boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
//           zIndex: 999,
//         }}
//       >
//         +
//       </button>

//       {
//         openAddWeight && (
//           <div
//             onClick={() => setOpenAddWeight(false)}
//             style={{
//               position: "fixed",
//               inset: 0,
//               background: "rgba(0,0,0,0.4)",
//               zIndex: 1000,
//             }}
//           >
//             <div
//               onClick={(e) => e.stopPropagation()}
//               style={{
//                 position: "absolute",
//                 bottom: 0,
//                 left: 0,
//                 right: 0,
//                 background: cardBg,
//                 borderTopLeftRadius: "24px",
//                 borderTopRightRadius: "24px",
//                 padding: "24px",
//                 animation: "slideUp 0.3s ease-out",
//               }}
//             >
//               <h3 style={{ marginTop: 0 }}>
//                 ➕ {t("profile.sections.addWeight")}
//               </h3>

//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleAddWeight();
//                   setOpenAddWeight(false);
//                 }}
//               >
//                 <input
//                   type="number"
//                   step="0.1"
//                   placeholder={t("profile.fields.weightPlaceholder")}
//                   value={newWeight}
//                   onChange={(e) => setNewWeight(e.target.value)}
//                   style={{
//                     width: "100%",
//                     height: "48px",
//                     padding: "0 16px",
//                     marginBottom: "12px",
//                     borderRadius: "8px",
//                     border: "1px solid #ccc",
//                   }}
//                 />

//                 <textarea
//                   placeholder={t("profile.fields.notePlaceholder")}
//                   value={note}
//                   onChange={(e) => setNote(e.target.value)}
//                   style={{
//                     width: "100%",
//                     height: "72px",
//                     padding: "12px 16px",
//                     borderRadius: "8px",
//                     border: "1px solid #ccc",
//                   }}
//                 />

//                 <button
//                   type="submit"
//                   disabled={saving || !newWeight}
//                   style={{
//                     width: "100%",
//                     height: "48px",
//                     marginTop: "16px",
//                     background:
//                       "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
//                     color: "#fff",
//                     borderRadius: "12px",
//                     fontWeight: "600",
//                     opacity: saving || !newWeight ? 0.6 : 1,
//                     border: "none",
//                   }}
//                 >
//                   {saving
//                     ? t("profile.buttons.saving")
//                     : t("profile.buttons.save")}
//                 </button>
//               </form>
//             </div>
//           </div>
//         )

//       }
//       {
//         openEditProfileInfo && (
//           <div
//             onClick={() => setOpenEditProfileInfo(false)}
//             style={{
//               position: "fixed",
//               inset: 0,
//               background: "rgba(0,0,0,0.4)",
//               zIndex: 1000,
//             }}
//           >
//             <div
//               onClick={(e) => e.stopPropagation()}
//               style={{
//                 position: "absolute",
//                 bottom: 0,
//                 left: 0,
//                 right: 0,
//                 background: cardBg,
//                 borderTopLeftRadius: "24px",
//                 borderTopRightRadius: "24px",
//                 padding: "24px",
//                 animation: "slideUp 0.3s ease-out",
//               }}
//             >
//               <h3 style={{ marginTop: 0 }}>✏️ Edit Profile Info</h3>

//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleSaveProfileInfo();
//                 }}
//               >
//                 <input
//                   type="number"
//                   placeholder="Height (cm)"
//                   value={editHeight}
//                   onChange={(e) => setEditHeight(e.target.value)}
//                   style={{
//                     width: "100%",
//                     height: "48px",
//                     padding: "0 16px",
//                     marginBottom: "12px",
//                     borderRadius: "8px",
//                     border: "1px solid #ccc",
//                   }}
//                 />

//                 <input
//                   type="number"
//                   placeholder="Age"
//                   value={editAge}
//                   onChange={(e) => setEditAge(e.target.value)}
//                   style={{
//                     width: "100%",
//                     height: "48px",
//                     padding: "0 16px",
//                     marginBottom: "12px",
//                     borderRadius: "8px",
//                     border: "1px solid #ccc",
//                   }}
//                 />

//                 <button
//                   type="submit"
//                   disabled={savingProfileInfo || !editHeight || !editAge}
//                   style={{
//                     width: "100%",
//                     height: "48px",
//                     marginTop: "16px",
//                     background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
//                     color: "#fff",
//                     borderRadius: "12px",
//                     fontWeight: "600",
//                     opacity:
//                       savingProfileInfo || !editHeight || !editAge ? 0.6 : 1,
//                     border: "none",
//                   }}
//                 >
//                   {savingProfileInfo ? "Saving..." : "Save Profile Info"}
//                 </button>
//               </form>
//             </div>
//           </div>
//         )
//       }
//       <style>
//         {`
//     @keyframes slideUp {
//       from {
//         transform: translateY(100%);
//       }
//       to {
//         transform: translateY(0);
//       }
//     }
//   `}
//       </style>
//     </div>

//   );
// }

// client/src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import useServerError from "../hooks/useServerError";
// import { registerFcmToken } from "../firebase/registerFcmToken";
import { Button, CircularProgress } from "@mui/material";
// import SyncIcon from "@mui/icons-material/Sync";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function Profile() {
  const handleServerError = useServerError();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  // const [transferring, setTransferring] = useState(false);

  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [openAddWeight, setOpenAddWeight] = useState(false);

  // ✅ نافذة ثانية لتعديل بيانات البروفايل
  const [openEditProfileInfo, setOpenEditProfileInfo] = useState(false);
  const [editHeight, setEditHeight] = useState("");
  const [editAge, setEditAge] = useState("");
  const [savingProfileInfo, setSavingProfileInfo] = useState(false);

  // const [fcmStatus, setFcmStatus] = useState({
  //   checked: false,
  //   ownedByCurrentUser: true,
  // });

  const [bmiIndicator, setBmiIndicator] = useState(0);

  // const checkFcmOwnership = async () => {
  //   try {
  //     const token = await registerFcmToken({ silent: true });
  //     if (!token) {
  //       setFcmStatus({ checked: true, ownedByCurrentUser: false });
  //       return;
  //     }

  //     const { data } = await Api.post("/users/fcm/check", {
  //       fcmToken: token,
  //     });

  //     setFcmStatus({
  //       checked: true,
  //       ownedByCurrentUser: data.ownedByCurrentUser === true,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     setFcmStatus({ checked: true, ownedByCurrentUser: false });
  //   }
  // };

  // async function transferFcmToThisDevice() {
  //   try {
  //     setTransferring(true);

  //     const token = await registerFcmToken({ silent: true });
  //     if (!token) throw new Error("NO_TOKEN");

  //     await Api.post("/users/fcm/transfer", { fcmToken: token });

  //     // ❌ لا toast هنا
  //   } catch (err) {
  //     console.error(err);
  //     throw err;
  //   } finally {
  //     setTransferring(false);
  //   }
  // }

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ تعبئة الطول والعمر داخل نافذة Edit Profile Info
  useEffect(() => {
    if (user) {
      setEditHeight(user.height || "");
      setEditAge(user.age || "");
    }
  }, [user]);

  const handleAddWeight = async () => {
    if (!newWeight) return toast.warning(t("profile.errors.weightRequired"));

    setSaving(true);
    try {
      await Api.post("/users/me/weight", {
        weight: parseFloat(newWeight),
        note,
      });
      toast.success(t("profile.messages.weightSaved"));
      setNewWeight("");
      setNote("");
      fetchProfile();
    } catch (err) {
      handleServerError(err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ حفظ الطول والعمر
  const handleSaveProfileInfo = async () => {
    if (!editHeight || !editAge) {
      return toast.warning(t("profile.edit.required"));
    }

    const height = Number(editHeight);
    const age = Number(editAge);

    // ✅ تحقق من الأرقام
    if (isNaN(height) || height < 100 || height > 250) {
      return toast.warning(t("profile.edit.invalidHeight"));
    }

    if (isNaN(age) || age < 10 || age > 100) {
      return toast.warning(t("profile.edit.invalidAge"));
    }

    setSavingProfileInfo(true);
    try {
      await Api.put("/users/me", {
        height,
        age,
      });

      toast.success(t("profile.edit.success"));
      setOpenEditProfileInfo(false);
      fetchProfile();
    } catch (err) {
      handleServerError(err);
    } finally {
      setSavingProfileInfo(false);
    }
  };

  // ===============================
  // ▶ BMI CALCULATIONS
  // ===============================
  const heightM = user?.height ? user.height / 100 : 0;
  const bmi =
    user?.weight && heightM
      ? (user.weight / (heightM * heightM)).toFixed(1)
      : null;

  let bmiStatus = "";
  let bmiColor = "";

  if (bmi) {
    if (bmi < 18.5) {
      bmiStatus = t("profile.bmi.underweight");
      bmiColor = "#3b82f6"; // blue
    } else if (bmi < 25) {
      bmiStatus = t("profile.bmi.normal");
      bmiColor = "#22c55e"; // green
    } else if (bmi < 30) {
      bmiStatus = t("profile.bmi.overweight");
      bmiColor = "#eab308"; // yellow
    } else {
      bmiStatus = t("profile.bmi.obese");
      bmiColor = "#ef4444"; // red
    }
  }

  const idealMin = user?.height ? (18.5 * heightM * heightM).toFixed(1) : null;
  const idealMax = user?.height ? (24.9 * heightM * heightM).toFixed(1) : null;

  // ===============================
  // ▶ BMI SCALE HELPERS
  // ===============================
  const getBmiPercent = (bmi) => {
    const min = 15;
    const max = 40;
    const clamped = Math.min(Math.max(bmi, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  // ✅ حركة المؤشر
  useEffect(() => {
    if (!bmi) return;

    const percent = getBmiPercent(Number(bmi));

    setBmiIndicator(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBmiIndicator(percent);
      });
    });
  }, [bmi]);

  // ===============================
  // ▶ CHART DATA
  // ===============================
  const weightHistory = user?.weightHistory || [];

  const chartData = {
    labels: weightHistory.map((w) =>
      new Date(w.date).toLocaleDateString(
        i18n.language === "ar"
          ? "ar-EG"
          : i18n.language === "he"
            ? "he-IL"
            : "en-US",
        { month: "short", day: "numeric" }
      )
    ),
    datasets: [
      {
        label: t("profile.chart.label"),
        data: weightHistory.map((w) => w.weight),
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(
            0,
            isDark ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)"
          );
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          return gradient;
        },
        borderColor: isDark ? "#C084FC" : "#6366f1",
        borderWidth: 3,
        pointBackgroundColor: isDark ? "#C084FC" : "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
    ],
  };

  const textMain = isDark ? "#FFF" : "#111827";
  const textSub = isDark ? "#AAA" : "#6b7280";
  const cardBg = isDark ? "#232334" : "#FFFFFF";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      intersect: true,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => {
            const index = items[0].dataIndex;
            const w = weightHistory[index];
            return new Date(w.date).toLocaleDateString(
              i18n.language === "ar"
                ? "ar-EG"
                : i18n.language === "he"
                  ? "he-IL"
                  : "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );
          },
          label: (item) => {
            const w = weightHistory[item.dataIndex];
            return `${t("profile.chart.weight")}: ${w.weight} ${t(
              "profile.units.kg"
            )}`;
          },
          afterLabel: (item) => {
            const w = weightHistory[item.dataIndex];
            return w.note
              ? `${t("profile.chart.note")}: ${w.note}`
              : t("profile.chart.noNote");
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? "#ccc" : "#444",
        },
      },
      y: {
        ticks: {
          color: isDark ? "#ccc" : "#444",
        },
      },
    },
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
        dir: i18n.language === "ar" ? "rtl" : "ltr",
      }}
    >
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* ===============================
            HEADER
        =============================== */}
        <div
          style={{
            padding: "20px",
            borderRadius: "20px",
            background: isDark
              ? "linear-gradient(135deg, #312E81, #5B21B6, #831843)"
              : "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
            color: "#fff",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            {user?.username?.charAt(0) || "U"}
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: "20px" }}>
              {user?.username || t("profile.labels.user")}
            </h2>
            <p style={{ margin: 0, opacity: 0.85, fontSize: "13px" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* ===============================
            تنبيه عند غياب الطول
        =============================== */}
        {!user?.height && (
          <div
            style={{
              background: isDark ? "rgba(245, 158, 11, 0.15)" : "#fff7ed",
              color: isDark ? "#fcd34d" : "#9a3412",
              border: isDark
                ? "1px solid rgba(245, 158, 11, 0.3)"
                : "1px solid #fdba74",
              padding: "14px 16px",
              borderRadius: "16px",
              marginBottom: "20px",
              fontWeight: 600,
            }}
          >
            {t("profile.bmi.heightRequired")}          </div>
        )}

        {/* ===============================
            BMI SECTION
        =============================== */}
        {bmi && (
          <div
            style={{
              background: cardBg,
              borderRadius: "24px",
              padding: "28px",
              marginBottom: "32px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "16px", color: textMain }}>
              {t("profile.bmi.title")}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                borderRadius: "16px",
                background: bmiColor + "22",
                border: `2px solid ${bmiColor}`,
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  fontWeight: 800,
                  color: bmiColor,
                  minWidth: "80px",
                  textAlign: "center",
                }}
              >
                {bmi}
              </div>

              <div>
                <p style={{ margin: 0, fontWeight: 600, color: bmiColor }}>
                  {bmiStatus}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: textSub }}>
                  {t("profile.bmi.idealWeight")}: {idealMin}–{idealMax}{" "}
                  {t("profile.units.kg")}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  position: "relative",
                  height: "14px",
                  borderRadius: "999px",
                  overflow: "hidden",
                  background:
                    "linear-gradient(to right, #3b82f6 0%, #22c55e 40%, #22c55e 62%, #eab308 75%, #ef4444 100%)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: `${bmiIndicator}%`,
                    transition: "left 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "left",
                    transform: "translateX(-50%)",
                    width: "0",
                    height: "0",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `10px solid ${bmiColor}`,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: textSub,
                  marginTop: "6px",
                }}
              >
                <span>18.5</span>
                <span>24.9</span>
                <span>30+</span>
              </div>
            </div>

            <p style={{ color: textSub }}>
              {t("profile.bmi.healthyRange")}: <strong>18.5 – 24.9</strong>
            </p>

            {idealMin && idealMax && (
              <p style={{ color: textSub }}>
                {t("profile.bmi.idealWeight")}:{" "}
                <strong>
                  {idealMin}–{idealMax} {t("profile.units.kg")}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* ===============================
            OTHER STATS (GRID)
        =============================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "24px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              icon: "⚖️",
              label: t("profile.stats.currentWeight"),
              value: user?.weight
                ? `${user.weight} ${t("profile.units.kg")}`
                : "-",
            },
            {
              icon: "📏",
              label: t("profile.stats.height"),
              value: user?.height
                ? `${user.height} ${t("profile.units.cm")}`
                : "-",
            },
            {
              icon: "🎂",
              label: t("profile.stats.age"),
              value: user?.age || "-",
            },
            {
              icon: "🏋️",
              label: t("profile.stats.completed"),
              value: user?.stats?.completedBookings || 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: cardBg,
                padding: "14px",
                borderRadius: "14px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: "28px" }}>{stat.icon}</div>
              <p style={{ color: textSub, fontSize: "12px" }}>{stat.label}</p>
              <h3 style={{ color: textMain, margin: 0 }}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* ===============================
            EDIT PROFILE INFO BUTTON
        =============================== */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <button
            onClick={() => setOpenEditProfileInfo(true)}
            style={{
              border: "none",
              borderRadius: "14px",
              padding: "12px 20px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            }}
          >
            {t("profile.edit.title")}          </button>
        </div>

        {/* ===============================
            CHART
        =============================== */}
        <div
          style={{
            background: cardBg,
            borderRadius: "24px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2>{t("profile.sections.weightProgress")}</h2>

          {weightHistory.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: window.innerWidth < 600 ? "200px" : "320px",
                position: "relative",
              }}
            >
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p
              style={{ textAlign: "center", color: textSub, padding: "24px 0" }}
            >
              {t("profile.messages.noWeightData")}
            </p>
          )}
        </div>
      </div>

      {/* زر إضافة وزن */}
      <button
        onClick={() => setOpenAddWeight(true)}
        style={{
          position: "fixed",
          bottom: "60px",
          right: i18n.language === "ar" ? "auto" : "24px",
          left: i18n.language === "ar" ? "24px" : "auto",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #a855f7, #6366f1)",
          color: "#fff",
          fontSize: "36px",
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
          zIndex: 999,
        }}
      >
        +
      </button>

      {/* نافذة إضافة وزن */}
      {openAddWeight && (
        <div
          onClick={() => setOpenAddWeight(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: cardBg,
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              ➕ {t("profile.sections.addWeight")}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddWeight();
                setOpenAddWeight(false);
              }}
            >
              <input
                type="number"
                step="0.1"
                placeholder={t("profile.fields.weightPlaceholder")}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />

              <textarea
                placeholder={t("profile.fields.notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  width: "100%",
                  height: "72px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />

              <button
                type="submit"
                disabled={saving || !newWeight}
                style={{
                  width: "100%",
                  height: "48px",
                  marginTop: "16px",
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                  color: "#fff",
                  borderRadius: "12px",
                  fontWeight: "600",
                  opacity: saving || !newWeight ? 0.6 : 1,
                  border: "none",
                }}
              >
                {saving
                  ? t("profile.buttons.saving")
                  : t("profile.buttons.save")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل بيانات البروفايل */}
      {openEditProfileInfo && (
        <div
          onClick={() => setOpenEditProfileInfo(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: cardBg,
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <h3 style={{ marginTop: 0 }}>✏️ {t("profile.edit.open")}</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfileInfo();
              }}
            >
              <input
                type="number"
                placeholder={t("profile.edit.height")} value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />

              <input
                type="number"
                placeholder={t("profile.edit.age")}
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />

              <button
                type="submit"
                disabled={savingProfileInfo || !editHeight || !editAge}
                style={{
                  width: "100%",
                  height: "48px",
                  marginTop: "16px",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#fff",
                  borderRadius: "12px",
                  fontWeight: "600",
                  opacity:
                    savingProfileInfo || !editHeight || !editAge ? 0.6 : 1,
                  border: "none",
                }}
              >
                {savingProfileInfo
                  ? t("profile.buttons.saving")
                  : t("profile.edit.save")}              </button>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}