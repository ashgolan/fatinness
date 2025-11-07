import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * 🔹 رفع صورة إلى Firebase واستبدال القديمة إذا وجدت
 * @param {File} file - ملف الصورة
 * @param {String} type - نوع الصورة ("logo" أو "card")
 * @returns {Promise<string>} رابط الصورة الجديدة
 */
export const uploadBrandImage = async (file, type = "logo") => {
  if (!file) throw new Error("❌ لم يتم تحديد ملف للرفع");

  const folder = type === "card" ? "cards" : "logos";
  const fileRef = ref(storage, `${folder}/${type}.png`);

  try {
    // حذف الصورة القديمة إن وجدت
    await deleteObject(fileRef).catch(() => {});

    // رفع الصورة الجديدة
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`✅ ${type} uploaded successfully:`, downloadURL);
    return downloadURL;
  } catch (err) {
    console.error(`🔥 Error uploading ${type}:`, err);
    throw err;
  }
};
