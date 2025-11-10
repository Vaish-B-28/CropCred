// src/pages/Auth.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DemoOtpPrompt from "../components/DemoOtpPrompt";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = (pw) => pw && pw.length >= 8 && /[0-9]/.test(pw) && /[A-Z]/.test(pw);

export default function Auth() {
  const { user, loginPassword, sendOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  // 🔔 moved INSIDE component:
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  useEffect(() => {
    const q = searchParams.get("mode");
    if (q === "signup") setMode("signup");
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role === "farmer") nav("/farmer");
      else nav("/consumer");
    }
  }, [user, nav]);

  // -------------------
  // SIGN IN (password only)
  // -------------------
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siRole, setSiRole] = useState("farmer");
  const [siError, setSiError] = useState("");

  async function handleSignIn(e) {
    e.preventDefault();
    setSiError("");
    if (!emailRegex.test(siEmail)) return setSiError("Enter a valid email.");
    if (!siPassword) return setSiError("Enter your password.");
    try {
      await loginPassword({ email: siEmail, role: siRole, password: siPassword });
      // redirect handled by useEffect
    } catch (err) {
      setSiError(err.message || "Sign in failed.");
    }
  }

  // -------------------
  // SIGN UP (OTP + password)
  // -------------------
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suRole, setSuRole] = useState("farmer");
  const [suExtra, setSuExtra] = useState("");
  const [suError, setSuError] = useState("");
  const [suOtpSent, setSuOtpSent] = useState(false);
  const [suOtp, setSuOtp] = useState("");
  const [suNonce, setSuNonce] = useState("");

  async function handleSendOtpSignUp(e) {
    e.preventDefault();
    setSuError("");
    if (!suName) return setSuError("Please enter your full name.");
    if (!emailRegex.test(suEmail)) return setSuError("Enter a valid email.");
    if (!passwordRules(suPassword)) return setSuError("Password must be ≥8 chars, include number and uppercase.");
    if (suPassword !== suConfirm) return setSuError("Passwords do not match.");

    try {
      const resp = await sendOtp({ email: suEmail, role: suRole, name: suName, extra: suExtra });

      // Show demo OTP modal
      if (resp.devOtp) {
        setDemoOtp(resp.devOtp);
        setOtpModalOpen(true);
      }

      // Desktop notification (demo)
      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted" && resp.devOtp) {
            new Notification("Your CropCred OTP", { body: `Code: ${resp.devOtp}` });
          }
        } catch {}
      }

      setSuNonce(resp.nonce);
      setSuOtpSent(true);
      if (resp.devOtp) setSuOtp(resp.devOtp); // dev convenience
      sessionStorage.setItem("cropcred_temp_sign", JSON.stringify({
        name: suName, email: suEmail, role: suRole, extra: suExtra, nonce: resp.nonce, password: suPassword
      }));
    } catch (err) {
      setSuError(err.message || "Failed to send OTP.");
    }
  }

  async function handleVerifyOtpSignUp(e) {
    e.preventDefault();
    setSuError("");
    if (!suOtp || suOtp.length < 4) return setSuError("Enter the OTP code.");
    try {
      await verifyOtp({
        email: suEmail,
        role: suRole,
        otp: suOtp,
        nonce: suNonce,
        name: suName,
        extra: suExtra,
        password: suPassword, // so backend can store passwordHash
      });
      sessionStorage.removeItem("cropcred_temp_sign");
      // redirect handled by useEffect
    } catch (err) {
      setSuError(err.message || "OTP verification failed.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 920 }}>
      <div className="card" style={{ padding: 28, marginTop: 24 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="h2">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
            <p style={{ color: "var(--muted)" }}>
              {mode === "signin" ? "Sign in with your email, role, and password" : "Sign up with OTP verification"}
            </p>
          </div>
          <div>
            <button className="btn small-btn" onClick={() => setMode("signin")} style={{ opacity: mode === "signin" ? 1 : 0.7 }}>
              Sign In
            </button>
            <button className="btn small-btn" onClick={() => setMode("signup")} style={{ marginLeft: 8, background: "#ff9800", opacity: mode === "signup" ? 1 : 0.85 }}>
              Sign Up
            </button>
          </div>
        </div>

        {/* SIGN IN (password) */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} style={{ marginTop: 18 }}>
            <div className="form-row">
              <label>Email</label>
              <input value={siEmail} onChange={(e) => setSiEmail(e.target.value)} type="email" required />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input value={siPassword} onChange={(e) => setSiPassword(e.target.value)} type="password" required />
            </div>
            <div className="form-row">
              <label>Role</label>
              <select value={siRole} onChange={(e) => setSiRole(e.target.value)}>
                <option value="farmer">Farmer</option>
                <option value="consumer">Consumer</option>
              </select>
            </div>
            {siError && <div style={{ color: "red", marginBottom: 10 }}>{siError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" type="submit">Sign In</button>
              <button type="button" className="btn" style={{ background: "#ff9800" }} onClick={() => setMode("signup")}>
                Create account
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP (OTP + password) */}
        {mode === "signup" && (
          <div style={{ marginTop: 18 }}>
            {!suOtpSent ? (
              <form onSubmit={handleSendOtpSignUp}>
                <div className="form-row">
                  <label>Full name</label>
                  <input value={suName} onChange={(e) => setSuName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input value={suEmail} onChange={(e) => setSuEmail(e.target.value)} type="email" required />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="form-row">
                      <label>Password</label>
                      <input value={suPassword} onChange={(e) => setSuPassword(e.target.value)} type="password" required />
                      <small style={{ color: "var(--muted)" }}>At least 8 chars, one uppercase, one number</small>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="form-row">
                      <label>Confirm Password</label>
                      <input value={suConfirm} onChange={(e) => setSuConfirm(e.target.value)} type="password" required />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label>Role</label>
                  <select value={suRole} onChange={(e) => setSuRole(e.target.value)}>
                    <option value="farmer">Farmer</option>
                    <option value="consumer">Consumer</option>
                  </select>
                </div>
                {suRole === "farmer" ? (
                  <div className="form-row">
                    <label>Farm / Organization (optional)</label>
                    <input value={suExtra} onChange={(e) => setSuExtra(e.target.value)} placeholder="Ex: Green Valley Farms" />
                  </div>
                ) : (
                  <div className="form-row">
                    <label>Additional info (optional)</label>
                    <input value={suExtra} onChange={(e) => setSuExtra(e.target.value)} placeholder="Short note or interest" />
                  </div>
                )}
                {suError && <div style={{ color: "red", marginBottom: 10 }}>{suError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" type="submit">Send verification code (OTP)</button>
                  <button type="button" className="btn" onClick={() => setMode("signin")} style={{ background: "#ccc", color: "#111" }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSignUp} style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}><strong>OTP sent to {suEmail}</strong></div>
                <div className="form-row">
                  <label>Enter OTP</label>
                  <input value={suOtp} onChange={(e) => setSuOtp(e.target.value)} placeholder="Enter 6-digit code" />
                </div>
                {suError && <div style={{ color: "red", marginBottom: 10 }}>{suError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" type="submit">Verify & Create Account</button>
                  <button type="button" className="btn" onClick={() => { setSuOtpSent(false); setSuOtp(""); }} style={{ background: "#ccc", color: "#111" }}>
                    Back
                  </button>
                </div>
              </form>
            )}
            <DemoOtpPrompt open={otpModalOpen} otp={demoOtp} onClose={()=>setOtpModalOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
