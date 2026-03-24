import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "https://nexus-ai-3o4n.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("nexus_token");
      const savedUser = localStorage.getItem("nexus_user");
      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser({ ...parsedUser, token: savedToken });
      }
    } catch {
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = async (name, email, password) => {
    try {
      const response = await api.post("/auth/signup", { name, email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem("nexus_token", token);
      localStorage.setItem("nexus_user", JSON.stringify(userData));
      setUser({ ...userData, token });
      return userData;
    } catch (err) {
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        throw new Error("Cannot connect to server. Please try again later.");
      }
      if (err.response?.status === 400) {
        throw new Error(err.response.data?.error || "Email already registered.");
      }
      if (err.response?.status === 500) {
        throw new Error("Server error. Please try again.");
      }
      throw new Error(err.response?.data?.error || "Signup failed. Please try again.");
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem("nexus_token", token);
      localStorage.setItem("nexus_user", JSON.stringify(userData));
      setUser({ ...userData, token });
      return userData;
    } catch (err) {
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        throw new Error("Cannot connect to server. Please try again later.");
      }
      if (err.response?.status === 401) {
        throw new Error("Invalid email or password.");
      }
      throw new Error(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#33cc33] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};