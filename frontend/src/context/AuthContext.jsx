import { createContext, useContext, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("smarthire_user");
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (data) => {
    localStorage.setItem("smarthire_user", JSON.stringify(data));
    setUser(data);
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    persist(data);
    return data;
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    persist(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("smarthire_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
