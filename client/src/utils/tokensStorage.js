import Cookies from "js-cookie";


export const setToken = (token) => {
Cookies.set("JWT", token, { expires: 7 }); // أسبوع
};


export const getToken = () => Cookies.get("JWT");


export const clearToken = () => Cookies.remove("JWT");