// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/");
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="logo">
          <Link to="/">CropCred</Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          {/* No direct Farmer/Consumer links here anymore */}
        </nav>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link to="/auth" className="btn small-btn" style={{ marginRight: 8 }}>
                Sign In
              </Link>
              <Link to="/auth?mode=signup" className="btn small-btn" style={{ background: "#ff9800" }}>
                Sign Up
              </Link>
            </>
          ) : (
            <div className="user-area">
              <span className="user-name">Hi, {user.name || user.email}</span>
              <div style={{ display: "inline-block", marginLeft: 12 }}>
                {user.role === "farmer" ? (
                  <Link to="/farmer" className="btn small-btn">
                    My Farmer Dashboard
                  </Link>
                ) : (
                  <Link to="/consumer" className="btn small-btn">
                    Consumer Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="btn small-btn" style={{ marginLeft: 8, background: "#d32f2f" }}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

