// تحويل الأرقام العربية الهندية → أرقام عربية غربية
export const fixDigits = (str = "") => {
  return str.replace(/[٠-٩]/g, (d) => "0123456789"[d.charCodeAt(0) - 1632]);
};
