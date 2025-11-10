// src/pages/CreateBatch.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../contexts/AuthContext";


const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function CreateBatch() {
  const [form, setForm] = useState({
    cropName: "",
    variety: "",
    plantingDate: "",
    location: "",
    notes: "",
  });
  const [posting, setPosting] = useState(false);
  const nav = useNavigate();
  const { token, user } = useAuth?.() || {}; // token for auth, user.address if you have it

  const handleCreate = async () => {
    if (!form.cropName || !form.variety || !form.plantingDate || !form.location) {
      alert("Please fill in all required fields.");
      return;
    }
    if (posting) return;
    setPosting(true);

    const batchId = "BATCH-" + uuidv4().slice(0, 8);

    // 1) Create Certificates row linked to farmer
    try {
      const body = {
        batchId,
        name: form.cropName,
        cropType: form.variety,
        harvestDate: form.plantingDate,
        origin: form.location,
        ownerAddress: user?.address || null, // ok if null for now
        meta: form.notes ? { notes: form.notes } : undefined,
      };

      const r = await fetch(`${API}/cert/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e.error || `Failed to create batch (HTTP ${r.status})`);
        setPosting(false);
        return;
      }
    } catch (e) {
      alert(String(e));
      setPosting(false);
      return;
    }

    // 2) (Optional) Issue on-chain certificate immediately (will succeed only if backend signer is contract owner)
    try {
      const certificateID = `CERT-${batchId}`;
      await fetch(`${API}/cert/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          certificateID,
          ownerAddress: user?.address || "0x0000000000000000000000000000000000000000",
          meta: { batchId },
        }),
      });
    } catch {
      // ignore for demo if not owner
    }

    setPosting(false);
    // 3) Go to details page (where you add lifecycle checkpoints)
    nav(`/farmer/batch/${batchId}`);
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "10px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#2e7d32" }}>🌱 Create Batch</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
            Crop Name *
          </label>
          <input
            value={form.cropName}
            onChange={(e) => setForm({ ...form, cropName: e.target.value })}
            placeholder="e.g., Wheat"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
            Variety *
          </label>
          <input
            value={form.variety}
            onChange={(e) => setForm({ ...form, variety: e.target.value })}
            placeholder="e.g., Durum"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
              Planting Date *
            </label>
            <input
              type="date"
              value={form.plantingDate}
              onChange={(e) => setForm({ ...form, plantingDate: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
              Location *
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Pune, India"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
            Notes / Sustainability Practices
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleCreate}
          disabled={posting}
          style={{
            background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
            color: "#fff",
            padding: "10px 18px",
            border: "none",
            borderRadius: 6,
            cursor: posting ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: posting ? 0.8 : 1,
          }}
        >
          {posting ? "Creating…" : "+ Create Batch"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  outline: "none",
  fontSize: "0.95rem",
};
