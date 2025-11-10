// src/pages/ScanQR.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScanQR() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleScan = () => {
  const val = (code || "").trim();
  if (!val) return;
  if (val.startsWith("http://") || val.startsWith("https://")) {
    // open exact link (works for /v/batch/:id or any external link)
    window.location.href = val;
  } else {
    // treat as batchId
    navigate(`/consumer/verify/${encodeURIComponent(val)}`);
  }
};


  return (
    <div className="card">
      <h2 style={{ marginBottom: 10 }}>📷 Scan or Enter QR Code</h2>
      <p style={{ color: "var(--muted)" }}>
        Use your camera to scan a crop batch QR, or paste the batch ID below.
      </p>
      <div className="form-row" style={{ marginTop: 12 }}>
        <label>Batch ID / URL</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="BATCH-xxxx or https://..."
          style={{ padding: 8, width: "100%", borderRadius: 6, border: "1px solid #ccc" }}
        />
      </div>
      <button
        className="btn"
        onClick={handleScan}
        style={{ marginTop: 12, ...buttonStyle }}
      >
        🔍 Open
      </button>
    </div>
  );
}

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
