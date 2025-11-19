import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";
import { v4 as uuidv4 } from "uuid";

/**
 * رفع الصور للوغو / الكارت / الألبوم
 */
export const uploadBrandImage = async (file, type = "logo") => {
  if (!file) throw new Error("❌ لم يتم تحديد ملف للرفع");

  let filePath;

  // 🟣 لوغو → ملف واحد ثابت
  if (type === "logo") {
    filePath = `logos/logo.png`;
  }

  // 🟡 كارت → ملف واحد ثابت
  else if (type === "card") {
    filePath = `cards/card.png`;
  }

  // 🔵 ألبوم صور → أسماء فريدة
  else if (type === "gallery") {
    // ⚠️ التفافي على مشكلة الامتداد
    const ext = file.type.split("/")[1] || "jpg";
    const id = uuidv4();
    filePath = `gallery/${id}.${ext}`;
  }

  const fileRef = ref(storage, filePath);
  console.log("🔥 رفع إلى:", filePath);

  try {
    // حذف القديم فقط مع logo & card
    if (type === "logo" || type === "card") {
      await deleteObject(fileRef).catch(() => {});
    }

    // رفع الصورة
    await uploadBytes(fileRef, file);

    // جلب الرابط
    let downloadURL = await getDownloadURL(fileRef);

    // إصلاح الرابط إذا لزم
    downloadURL = downloadURL.replace(
      "fateness-364c3.appspot.com",
      "fateness-364c3.firebasestorage.app"
    );

    return downloadURL;
  } catch (error) {
    console.error("🔥 خطأ في رفع الصورة:", error);
    throw new Error("فشل رفع الصورة – تحقق من الإنترنت أو CORS");
  }
};
