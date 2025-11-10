// src/pages/ConsumerDashboard.jsx
import React, { useState , useEffect} from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { FaQrcode, FaKeyboard, FaStore, FaBars } from "react-icons/fa";
import ScanQR from "./ScanQR";
import LifecycleViewer from "./LifecycleViewer";
import PublicVerify from "../PublicVerify";
const API = import.meta.env.VITE_API_BASE_URL || "/api";


export default function ConsumerDashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const navigate = useNavigate();

    const [crops, setCrops] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/cert/public/batches`);

        const j = await r.json();
        setCrops(j.items || []);
      } catch (e) {
        console.error("Failed to load marketplace:", e);
        setCrops([]); // safe fallback
      }
    })();
  }, []);

  
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
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
          {/* Hamburger */}
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
            <FaBars />
          </button>
          <h2 style={{ margin: 0 }}>🍃 CropCred Consumer</h2>
        </div>
      </header>

      {/* Layout */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        {menuOpen && (
          <aside
            style={{
              width: 220,
              background: "#f9f9f9",
              borderRight: "1px solid #ddd",
              padding: 16,
            }}
          >
            <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link to="/consumer" style={linkStyle}>
                <FaStore /> Marketplace
              </Link>
              <Link to="/consumer/scan" style={linkStyle}>
                <FaQrcode /> Scan QR
              </Link>
              
            </nav>
          </aside>
        )}

        {/* Main Section */}
        <main style={{ flex: 1, padding: 24 }}>
          <Routes>
  <Route path="/" element={<Marketplace crops={crops} navigate={navigate} />} />
  <Route path="scan" element={<ScanQR />} />
  <Route path="manual" element={<LifecycleViewer />} />
  <Route path="verify/:batchId" element={<PublicVerify />} />
</Routes>

        </main>
      </div>
    </div>
  );
}

function Marketplace({ crops, navigate }) {
  return (
    <div>
      <h2 style={{ color: "#2e7d32", marginBottom: 20 }}>🌾 Marketplace</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {crops.length === 0 && (
  <div className="card" style={{ padding: 16, borderRadius: 8 }}>
    No batches available yet. Try again in a moment.
  </div>
)}

        {crops.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
              padding: 16,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#333" }}>{c.crop}</h3>
            <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
              👨‍🌾 <strong>{c.farmer}</strong>
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
              📍 {c.location}
            </p>
            <p
              style={{
                margin: "6px 0 10px",
                fontWeight: 600,
                color: c.score >= 90 ? "#2e7d32" : "#f57c00",
              }}
            >
              ⭐ Credibility Score: {c.score}/100
            </p>
            <button
              style={buttonStyle}
              onClick={() => navigate(`/consumer/verify/${c.id}`)}
            >
              View Lifecycle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const linkStyle = {
  padding: "10px 14px",
  borderRadius: 6,
  background: "transparent",
  color: "#333",
  textDecoration: "none",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const buttonStyle = {
  background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
  color: "#fff",
  padding: "8px 14px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
};
