import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Timeline from "../../components/Timeline";
import QRGenerator from "../../components/QRGenerator";
import { useAuth } from "../../contexts/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function BatchDetails() {
  const { id } = useParams();
  const [events, setEvents] = useState([]);
  const [checkpoint, setCheckpoint] = useState({ step: "", detail: "" });
  const [posting, setPosting] = useState(false);
  const [qrTick, setQrTick] = useState(0); // force QR to regenerate
  const { token } = useAuth?.() || {};

  // ✅ Fetch events + credibility from backend
  async function load() {
    const r = await fetch(`${API}/events/batch/${encodeURIComponent(id)}`);
    if (!r.ok) throw new Error(`verify ${r.status}`);
    const j = await r.json();

    const mapped = (j.events || []).map((e) => ({
      step: e.eventType || "Event",
      detail: e.payload?.notes || e.payload?.detail || e.actor || "",
      time: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));

    setEvents(mapped.sort((a, b) => new Date(a.time) - new Date(b.time)));

  }
  useEffect(() => {
  load().catch((e) => console.error("Failed to load events:", e));
}, [id]);

  const addCheckpoint = async () => {
  if (posting) return;
  if (!checkpoint.step) return;
  setPosting(true);

  const body = {
    batchId: id,
    eventType: checkpoint.step.trim(),
    actor: "farmer",
    payload: { notes: (checkpoint.detail || "").trim() },

    createdAt: new Date().toISOString(),
  };

  const res = await fetch(`${API}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    alert(e.error || `Failed to add event (HTTP ${res.status})`);
    setPosting(false);
    return;
  }

  await load();                  // refresh timeline
  setCheckpoint({ step: "", detail: "" });
  setQrTick((t) => t + 1);       // force QR to refresh (cache-bust)
  setPosting(false);
};


  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
          padding: "14px 20px",
          borderRadius: "12px 12px 0 0",
          color: "#fff",
          fontSize: "1.4rem",
          fontWeight: 600,
        }}
      >
        🌱 Batch {id}
      </div>

      {/* Content */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 20,
          }}
        >
          {/* Left: Timeline */}
          <div>
            <h3
              style={{
                color: "#2e7d32",
                marginBottom: 12,
                borderBottom: "1px solid #ddd",
                paddingBottom: 6,
              }}
            >
              Lifecycle
            </h3>
            <Timeline events={events} />
          </div>

          {/* Right: Add Checkpoint */}
          <aside style={{ borderLeft: "1px solid #eee", paddingLeft: 16 }}>
            <h3
              style={{
                color: "#2e7d32",
                marginBottom: 12,
                borderBottom: "1px solid #ddd",
                paddingBottom: 6,
              }}
            >
              Add Checkpoint
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "#444",
                  }}
                >
                  Step *
                </label>
                <input
                  value={checkpoint.step}
                  onChange={(e) =>
                    setCheckpoint({ ...checkpoint, step: e.target.value })
                  }
                  placeholder="e.g., Harvested"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "#444",
                  }}
                >
                  Detail
                </label>
                <input
                  value={checkpoint.detail}
                  onChange={(e) =>
                    setCheckpoint({ ...checkpoint, detail: e.target.value })
                  }
                  placeholder="Notes about this step..."
                  style={inputStyle}
                />
              </div>

             <button style={buttonStyle} onClick={addCheckpoint} disabled={posting}>
  {posting ? "Adding…" : "+ Add Checkpoint"}
</button>


            </div>
          </aside>
        </div>

        {/* QR section (still inside the same root) */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#2e7d32", marginBottom: 12 }}>Share / QR</h3>
          <QRGenerator key={qrTick} batchId={id} />

        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  outline: "none",
  fontSize: "0.95rem",
};

const buttonStyle = {
  background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
  color: "#fff",
  padding: "10px 16px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
