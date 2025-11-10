// src/pages/FarmerDashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import CreateBatch from "./CreateBatch";
import BatchList from "./BatchList";
import BatchDetails from "./BatchDetails";
import QRGenerator from "../../components/QRGenerator";

export default function FarmerDashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // active link check
  const isActive = (path) => {
    if (path === "/farmer/list") {
      return (
        location.pathname === "/farmer" ||
        location.pathname.startsWith("/farmer/list") ||
        location.pathname.startsWith("/farmer/batch")
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7f6" }}>
      {/* Navbar */}
      <header
        style={{
          background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
          color: "#fff",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ☰
          </button>
          <h2 style={{ margin: 0 }}>🌱 CropCred Farmer</h2>
        </div>
      </header>

      {/* Layout */}
      <div style={{ display: "flex", flex: 1 }}>
        {menuOpen && (
          <aside
            style={{
              width: 240,
              background: "#fff",
              borderRight: "1px solid #ddd",
              padding: 16,
              transition: "transform 0.3s ease",
              boxShadow: "2px 0 6px rgba(0,0,0,0.05)",
              position: isMobile ? "absolute" : "relative",
              height: "100%",
              zIndex: 999,
            }}
          >
            <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link
                to="/farmer/create"
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: isActive("/farmer/create")
                    ? "linear-gradient(120deg, #0f9d58, #2e7d32)"
                    : "transparent",
                  color: isActive("/farmer/create") ? "#fff" : "#333",
                  textDecoration: "none",
                  fontWeight: isActive("/farmer/create") ? "600" : "500",
                }}
                onClick={() => isMobile && setMenuOpen(false)}
              >
                + Create Batch
              </Link>
              <Link
                to="/farmer/list"
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: isActive("/farmer/list")
                    ? "linear-gradient(120deg, #0f9d58, #2e7d32)"
                    : "transparent",
                  color: isActive("/farmer/list") ? "#fff" : "#333",
                  textDecoration: "none",
                  fontWeight: isActive("/farmer/list") ? "600" : "500",
                }}
                onClick={() => isMobile && setMenuOpen(false)}
              >
                My Batches
              </Link>
              <Link
                to="/farmer/qr"
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: isActive("/farmer/qr")
                    ? "linear-gradient(120deg, #0f9d58, #2e7d32)"
                    : "transparent",
                  color: isActive("/farmer/qr") ? "#fff" : "#333",
                  textDecoration: "none",
                  fontWeight: isActive("/farmer/qr") ? "600" : "500",
                }}
                onClick={() => isMobile && setMenuOpen(false)}
              >
                QR Generator
              </Link>
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main style={{ flex: 1, padding: 24 }}>
          <Routes>
            <Route index element={<BatchList />} />
            <Route path="create" element={<CreateBatch />} />
            <Route path="list" element={<BatchList />} />
            <Route path="batch/:id" element={<BatchDetails />} />
            <Route path="qr" element={<QRGenerator />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
