import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, userAPI } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await userAPI.getMe();
      setUser(res.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handler = () => fetchUser();
    window.addEventListener("authChange", handler);
    return () => window.removeEventListener("authChange", handler);
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    setUser(res.data.user);
    window.dispatchEvent(new Event("authChange"));
    return res.data;
  };

  const register = async (email, username, password, displayName) => {
    const res = await authAPI.register({
      email,
      username,
      password,
      display_name: displayName,
    });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    setUser(res.data.user);
    window.dispatchEvent(new Event("authChange"));
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isLoggedIn: !!user, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
