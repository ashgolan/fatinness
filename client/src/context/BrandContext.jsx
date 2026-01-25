import { createContext, useContext, useEffect, useState } from "react";
import { Api } from "../api/Api";
import useServerError from "../hooks/useServerError";

const BrandContext = createContext();
const DEFAULT_LOGO = "/brand/DEFAULT_LOGO.png";
const DEFAULT_CARD = "/brand/DEFAULT_CARD.jpg";

export function BrandProvider({ children }) {
  const handleServerError = useServerError();

  const [brand, setBrand] = useState({
    logoUrl: "",
    cardUrl: "",
    loading: true,
  });

  // 📦 جلب الإعدادات من السيرفر عند تشغيل التطبيق
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const { data } = await Api.get("/admin/settings");
        setBrand({
          logoUrl: data.logoUrl || data.LogoUrl || DEFAULT_LOGO,
          cardUrl: data.cardUrl || data.CardUrl || DEFAULT_CARD,
          loading: false,
        });
      } catch (error) {
        handleServerError(error);
        setBrand((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchBrand();
  }, []);

  // 🟢 تحديث الشعار أو البطاقة من صفحة الإعدادات مباشرة بعد رفعها
  const updateBrand = (newData) => {
    setBrand((prev) => ({
      ...prev,
      logoUrl: newData.logoUrl || prev.logoUrl || DEFAULT_LOGO,
      cardUrl: newData.cardUrl || prev.cardUrl || DEFAULT_CARD,
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
