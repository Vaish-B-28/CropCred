// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "cc_token";
const USER_KEY = "cc_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
  }, [token, user]);

  useEffect(() => {
    (async ()=>{
      try {
        if (!token) { setLoading(false); return; }
        const r = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` }});
        if (r.ok) setUser(await r.json());
        else { setUser(null); setToken(null); }
      } catch { setUser(null); setToken(null); }
      finally { setLoading(false); }
    })();
  }, []);

  // --- Sign up: OTP flow ---
  async function sendOtp({ email, role, name, extra }) {
    const r = await fetch(`${API}/api/auth/send-otp`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, role, name, extra })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Failed to send OTP");
    return data; // { nonce, devOtp? }
  }

  async function verifyOtp({ email, role, otp, nonce, name, extra, password }) {
    const r = await fetch(`${API}/api/auth/verify-otp`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, role, otp, nonce, name, extra, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "OTP verification failed");
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // --- Sign in: password (no OTP) ---
  async function loginPassword({ email, role, password }) {
    const r = await fetch(`${API}/api/auth/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, role, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login failed");
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout(){ setToken(null); setUser(null); }

  async function apiFetch(path, init = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const r = await fetch(`${API}${path}`, { ...init, headers });
    if (r.status === 401 || r.status === 403) { setToken(null); setUser(null); }
    return r;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOtp, verifyOtp, loginPassword, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(){ return useContext(AuthContext); }
