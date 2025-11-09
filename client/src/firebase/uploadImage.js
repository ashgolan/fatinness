import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";

/**
 * 🔹 رفع صورة إلى Firebase واستبدال القديمة إذا وجدت
 * @param {File} file - ملف الصورة
 * @param {"logo" | "card"} type - نوع الصورة ("logo" أو "card")
 * @returns {Promise<string>} رابط الصورة الجديدة
 */
export const uploadBrandImage = async (file, type = "logo") => {
  if (!file) throw new Error("❌ لم يتم تحديد ملف للرفع");

  const folder = type === "card" ? "cards" : "logos";
  const fileRef = ref(storage, `${folder}/${type}.png`);

  try {
    // 🧹 حذف الصورة القديمة (إن وجدت)
    await deleteObject(fileRef).catch(() => {});

    // ⏫ رفع الصورة الجديدة
    const snapshot = await uploadBytes(fileRef, file);

    // 🔗 الحصول على رابط التنزيل
    let downloadURL = await getDownloadURL(snapshot.ref);

    // ⚙️ إصلاح الرابط ليستخدم النطاق الصحيح دائمًا
    if (downloadURL.includes("appspot.com")) {
      downloadURL = downloadURL.replace(
        "fateness-364c3.appspot.com",
        "fateness-364c3.firebasestorage.app"
      );
    }

    console.log(`✅ ${type} uploaded successfully:`, downloadURL);
    return downloadURL;
  } catch (error) {
    console.error(`🔥 Error uploading ${type}:`, error);
    throw new Error(
      "حدث خطأ أثناء رفع الصورة. تحقق من اتصال الإنترنت أو إعدادات CORS."
    );
  }
};
