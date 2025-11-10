// src/pages/LifecycleViewer.jsx
import React from "react";
import { useParams } from "react-router-dom";

export default function LifecycleViewer() {
  const { batchId } = useParams();

  if (!batchId) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <h2>⚠️ No Batch Selected</h2>
        <p>Please scan a QR or enter a code to view lifecycle details.</p>
      </div>
    );
  }

  // Temporary mock data
  const checkpoints = [
    { step: "Cultivation", details: "Planted on Sept 10, 2025" },
    { step: "Harvesting", details: "Harvested on Sept 20, 2025" },
    { step: "Transport", details: "Shipped via AgriTrans Logistics" },
  ];

  return (
    <div className="container card" style={{ padding: 20 }}>
      <h1>🌱 Lifecycle for Batch: {batchId}</h1>
      <ul style={{ marginTop: 15, lineHeight: 1.8 }}>
        {checkpoints.map((cp, i) => (
          <li key={i}>
            <strong>{cp.step}:</strong> {cp.details}
          </li>
        ))}
      </ul>
    </div>
  );
}
