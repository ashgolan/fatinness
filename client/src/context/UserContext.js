import React, { createContext, useEffect, useState, useMemo } from "react";
import { Api } from "../api/Api";
import { getToken, clearToken } from "../utils/tokensStorage";


export const UserContext = createContext();


export function UserProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);


useEffect(() => {
const init = async () => {
try {
if (getToken()) {
const { data } = await Api.get("/users/me"); // عدّل المسار إذا كان مختلفًا في السيرفر
setUser(data);
}
} catch (e) {
clearToken();
setUser(null);
} finally {
setLoading(false);
}
};
init();
}, []);


const value = useMemo(() => ({ user, setUser, loading }), [user, loading]);


return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}