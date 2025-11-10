import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
const API = "http://localhost:5000/api";


export default function Verify() {
  const { certificateID } = useParams();
  const [verifyData, setVerifyData] = useState(null);
  const [events, setEvents] = useState([]);
  const [presigned, setPresigned] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Verify core (DB + on-chain)
        const v = await fetch(`${API}/verify/${encodeURIComponent(certificateID)}`);
        if (!v.ok) throw new Error(`verify ${v.status}`);
        const verifyJson = await v.json();

        // 2) Events timeline
        const ev = await fetch(`${API}/debug/events/${encodeURIComponent(certificateID)}`);
        if (!ev.ok) throw new Error(`events ${ev.status}`);
        const evJson = await ev.json();

        // 3) Presigned S3 download (best-effort)
        let dl = null;
        try {
          const d = await fetch(`${API}/cert/${encodeURIComponent(certificateID)}/download`);
          if (d.ok) dl = await d.json();
        } catch {}

        if (!dead) {
          setVerifyData(verifyJson);
          setEvents(Array.isArray(evJson.sample) ? evJson.sample : []);
          setPresigned(dl);
          setLoading(false);
        }
      } catch (e) {
        if (!dead) {
          setErr(String(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      dead = true;
    };
  }, [certificateID, tick]);

  const sortedEvents = useMemo(() => {
    return [...events]
      .map((e) => ({
        ...e,
        createdAt: e.createdAt || e.timestamp || e.created_at || null,
      }))
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
  }, [events]);

  const onChainHashes = useMemo(() => {
    if (Array.isArray(verifyData?.onChain?.hashes)) return verifyData.onChain.hashes;
    const fromEvents = sortedEvents.map((e) => e.hash).filter(Boolean);
    return fromEvents;
  }, [verifyData, sortedEvents]);

  const isValid = !!verifyData?.valid;
  const cert = verifyData?.db || null; // your /api/verify returns { db, onChain, valid }

  if (loading)
    return (
      <div className="container" style={{ padding: 18 }}>
        <Header id={certificateID} onRefresh={() => setTick((t) => t + 1)} />
        <div style={{ marginTop: 16, color: "#667085" }}>Loading…</div>
      </div>
    );

  if (err)
    return (
      <div className="container" style={{ padding: 18 }}>
        <Header id={certificateID} onRefresh={() => setTick((t) => t + 1)} />
        <div style={{ marginTop: 16, color: "#b00020" }}>Error: {err}</div>
      </div>
    );

  return (
    <div className="container" style={{ padding: 18 }}>
      <Header id={certificateID} onRefresh={() => setTick((t) => t + 1)} />

      {/* status */}
      <div
        className="card"
        style={{
          padding: 14,
          marginTop: 16,
          border:
            "1px solid " + (isValid ? "rgba(16,185,129,.4)" : "rgba(239,68,68,.4)"),
          background: isValid ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 12, color: "#667085" }}>Verification status</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: isValid ? "#047857" : "#b91c1c",
          }}
        >
          {isValid ? "Valid ✔" : "Invalid ✖"}
        </div>
        {verifyData?.onChain?.txHash && (
          <div style={{ fontSize: 12, color: "#667085", marginTop: 6, wordBreak: "break-all" }}>
            on-chain tx: {verifyData.onChain.txHash}
          </div>
        )}
      </div>

      {/* certificate */}
      <section className="card" style={{ padding: 14, marginTop: 16, borderRadius: 12 }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>
          Certificate
        </h2>
        <div style={{ fontSize: 14, display: "grid", gap: 6 }}>
          <div>
            <span style={{ color: "#667085" }}>ID:</span>{" "}
            {cert?.certificateID || certificateID}
          </div>
          <div>
            <span style={{ color: "#667085" }}>Owner:</span>{" "}
            {cert?.ownerAddress || "—"}
          </div>
          <div>
            <span style={{ color: "#667085" }}>S3 key:</span>{" "}
            {cert?.s3Key || presigned?.key || "—"}
          </div>
          <div style={{ wordBreak: "break-all" }}>
            <span style={{ color: "#667085" }}>SHA-256:</span>{" "}
            <code>{cert?.sha256 || "—"}</code>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {presigned?.url ? (
            <a
              href={presigned.url}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#111",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Download from S3
            </a>
          ) : (
            <button
              disabled
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                color: "#9ca3af",
                background: "#fff",
              }}
            >
              No file available
            </button>
          )}

          <a
            href={`${API}/credibility/${encodeURIComponent(certificateID)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#111827",
              background: "#fff",
            }}
          >
            View Credibility JSON
          </a>
        </div>
      </section>

      {/* on-chain hashes */}
      <section className="card" style={{ padding: 14, marginTop: 16, borderRadius: 12 }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>
          On-chain Proof
        </h2>
        {onChainHashes.length === 0 ? (
          <div style={{ fontSize: 14, color: "#667085" }}>No hashes reported.</div>
        ) : (
          <ul style={{ fontSize: 12, display: "grid", gap: 4 }}>
            {onChainHashes.map((h, i) => (
              <li key={h + i} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all" }}>
                {h}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* timeline */}
      <section className="card" style={{ padding: 14, marginTop: 16, borderRadius: 12 }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>
          Timeline
        </h2>
        {sortedEvents.length === 0 ? (
          <div style={{ fontSize: 14, color: "#667085" }}>No events yet.</div>
        ) : (
          <ol style={{ position: "relative", borderLeft: "1px solid #e5e7eb", paddingLeft: 14 }}>
            {sortedEvents.map((e, idx) => (
              <li key={(e.hash || e.eventId || idx) + ""} style={{ marginBottom: 16 }}>
                <time style={{ display: "block", fontSize: 12, color: "#667085" }}>
                  {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                </time>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.eventType || "EVENT"}</div>
                <div style={{ fontSize: 12, color: "#4b5563", wordBreak: "break-all" }}>
                  {e.hash ? (
                    <>
                      hash: <code>{e.hash}</code>
                      <br />
                    </>
                  ) : null}
                  {e.txHash ? (
                    <>
                      tx: <code>{e.txHash}</code>
                      <br />
                    </>
                  ) : null}
                </div>
                {e.payload ? (
                  <pre
                    style={{
                      fontSize: 12,
                      background: "#f9fafb",
                      padding: 8,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      overflow: "auto",
                      marginTop: 6,
                    }}
                  >
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Header({ id, onRefresh }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 12, color: "#667085" }}>Certificate</div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{id}</h1>
      </div>
      <button
        onClick={onRefresh}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
      >
        Refresh
      </button>
    </div>
  );
}
