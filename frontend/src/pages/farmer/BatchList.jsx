import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function BatchList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { token } = useAuth?.() || {};

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/cert/farmer/batches`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setItems(j.items || []);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div>
      <h2 className="h2">My Batches</h2>

      {loading && <div className="card">Loading…</div>}
      {err && <div className="card" style={{ color: "red" }}>Error: {err}</div>}

      {(!loading && items.length === 0) && (
        <div className="card">No batches yet. Create one to get started.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((b) => (
          <div key={b.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{b.crop}</strong><br />
              <small style={{ color: "var(--muted)" }}>ID: {b.id} • Created: {b.created}</small>
            </div>
            <div>
              <span style={{ marginRight: 8 }}>Cred: {b.cred}</span>
              <Link to={`/farmer/batch/${b.id}`} className="btn small-btn">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
