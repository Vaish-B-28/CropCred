import React, { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

// pull public settings from .env, with safe fallbacks
const BASE = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin; // e.g. http://localhost:5173
const PREFIX = import.meta.env.VITE_PUBLIC_VERIFY_PREFIX || "/v";            // e.g. /v

export default function QRGenerator({ batchId: batchIdProp }) {
  const [batchId, setBatchId] = useState(batchIdProp || "");
  const [url, setUrl] = useState("");
  const qrRef = useRef(null);

  const buildUrl = (id) => {
    const origin = String(BASE).replace(/\/+$/, "");
    const prefix = String(PREFIX).replace(/\/+$/, "");
    const safeId = encodeURIComponent(id);
    // final public route: <BASE><PREFIX>/batch/<batchId>?v=timestamp
    // example: http://localhost:5173/v/batch/BATCH-VERIFY-01?v=1731222222222
    return `${origin}${prefix}/batch/${safeId}?v=${Date.now()}`;
  };

  // If a batchId prop is supplied (from BatchDetails), auto-generate on mount/prop change
  useEffect(() => {
    if (batchIdProp) {
      setBatchId(batchIdProp);
      setUrl(buildUrl(batchIdProp));
    }
  }, [batchIdProp]);

  const gen = () => {
    const id = (batchId || "BATCH-DEMO").trim();
    setUrl(buildUrl(id));
  };

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied ✔");
    } catch {
      alert("Couldn’t copy link");
    }
  };

  const downloadSvg = () => {
    if (!qrRef.current) return;
    // react-qr-code renders an SVG; export via data URL
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const urlCreator = URL.createObjectURL(svgBlob);

    const a = document.createElement("a");
    a.href = urlCreator;
    a.download = `CropCred-${batchId || "BATCH-DEMO"}.svg`;
    a.click();
    URL.revokeObjectURL(urlCreator);
  };

  const isControlled = Boolean(batchIdProp); // coming from BatchDetails → no manual input needed

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
      }}
    >
      {/* Page Title */}
      <div
        style={{
          background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
          padding: "12px 18px",
          borderRadius: "12px 12px 0 0",
          color: "#fff",
          fontSize: "1.5rem",
          fontWeight: "600",
        }}
      >
        QR Generator
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Only show input & button when no prop is provided */}
        {!isControlled && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 500,
                  color: "#2e7d32",
                }}
              >
                Batch ID
              </label>
              <input
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="Enter batch ID or leave blank for demo"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={gen}
              style={{
                background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
                border: "none",
                padding: "10px 18px",
                borderRadius: 6,
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              Generate
            </button>
          </>
        )}

        {/* QR Display */}
        {url && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <div
              ref={qrRef}
              style={{
                background: "#fff",
                display: "inline-block",
                padding: 12,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <QRCode value={url} size={220} />
            </div>
            <p style={{ marginTop: 12, color: "#555", fontSize: "0.95rem" }}>
              Scan or share:{" "}
              <a
                href={url}
                style={{ color: "#0f9d58", textDecoration: "underline" }}
                target="_blank"
                rel="noreferrer"
              >
                {url}
              </a>
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={copyLink}
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
              >
                Copy Link
              </button>
              <button
                onClick={downloadSvg}
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
              >
                Download SVG
              </button>
            </div>
          </div>
        )}

        {/* Hint about where links go */}
        <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
          Links are built from <code>VITE_PUBLIC_BASE_URL</code> + <code>VITE_PUBLIC_VERIFY_PREFIX</code> →{" "}
          <code>{String(BASE).replace(/\/+$/, "")}{String(PREFIX).replace(/\/+$/, "")}/batch/&lt;batchId&gt;?v=timestamp</code>
        </div>
      </div>
    </div>
  );
}
