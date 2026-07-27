import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState(() => localStorage.getItem("ss_token") || null);

  const saveToken = (t) => {
    setToken(t);
    t ? localStorage.setItem("ss_token", t) : localStorage.removeItem("ss_token");
  };

  useEffect(() => {
    const init = async () => {
      if (!token) return setLoading(false);
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch {
        saveToken(null);
        delete api.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveToken(data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, defaultMarket) => {
    const { data } = await api.post("/auth/register", { name, email, password, defaultMarket });
    saveToken(data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    saveToken(null);
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const { data } = await api.patch("/auth/preferences", prefs);
    setUser(data.user);
    return data;
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, login, register, logout, updatePreferences, setUser }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
};
