import { createContext, useContext, useEffect, useState } from "react";
import { Api } from "../api/Api";

const BrandContext = createContext();

export function BrandProvider({ children }) {
const [brand, setBrand] = useState({
  logoUrl: "",
  cardUrl: "",
  loading: true, // ✅ مهم جدًا
});


  // 📦 جلب الإعدادات من السيرفر عند تشغيل التطبيق
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        console.log("🚀 جاري جلب إعدادات البراند من:", Api.defaults.baseURL + "/admin/settings");

        const { data } = await Api.get("/admin/settings");
        setBrand({
          logoUrl: data.logoUrl || "",
          cardUrl: data.cardUrl || "",
          loading: false,
        });
      } catch (error) {
        console.error("❌ خطأ أثناء تحميل إعدادات البراند:", error);
        setBrand((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchBrand();
  }, []);

  // 🟢 تحديث الشعار أو البطاقة من صفحة الإعدادات مباشرة بعد رفعها
  const updateBrand = (newData) => {
    setBrand((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
  <BrandContext.Provider value={{ ...brand, updateBrand }}>
    {children}
  </BrandContext.Provider>
  );
}

// 🪄 هوك للوصول إلى بيانات البراند في أي مكون
export const useBrand = () => useContext(BrandContext);
