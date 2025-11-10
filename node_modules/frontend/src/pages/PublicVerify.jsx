import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function PublicVerify() {
  const { batchId } = useParams();
  const { user, apiFetch } = useAuth();
  const [saveMsg, setSaveMsg] = useState("");

  const [data, setData] = useState(null);
  const [cred, setCred] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let dead = false;
    (async () => {
      setErr(null); setLoading(true);
      try {
       const res = await fetch(`${API}/events/batch/${encodeURIComponent(batchId)}`);

        if (!res.ok) throw new Error(`public verify ${res.status}`);
        const json = await res.json();

        // fetch credibility if certificateID present
        // use credibility if the verify endpoint already returns it
const credJson =
  json && typeof json.credibilityScore !== "undefined"
    ? { credibilityScore: json.credibilityScore, breakdown: json.breakdown }
    : null;

if (!dead) { 
  setData(json); 
  setCred(credJson); 
  setLoading(false); 
}


if (!dead) { setData(json); setCred(credJson); setLoading(false); }

      } catch (e) {
        if (!dead) { setErr(String(e)); setLoading(false); }
      }
    })();
    return () => { dead = true; };
  }, [batchId, tick]);

  const events = useMemo(() => {
    return (data?.events || []).map(e => ({
      ...e,
      createdAt: e.createdAt || e.timestamp || e.created_at || null
    })).sort((a,b) => new Date(a.createdAt||0) - new Date(b.createdAt||0));
  }, [data]);

    async function handleSave() {
    try {
      const resp = await apiFetch("/api/consumer/saved/batch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ batchId })
});
const respData = await resp.json();
if (!resp.ok) throw new Error(respData.error || "Save failed");
setSaveMsg("Saved ✓");

    } catch (e) {
      setSaveMsg(e.message);
    }
  }

  if (loading) return <Wrap><h2>Loading…</h2></Wrap>;
  if (err) return <Wrap><h2 style={{color:"#b91c1c"}}>Error: {err}</h2></Wrap>;

  return (
    <Wrap>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,color:"#667085"}}>Batch</div>
          <h1 style={{fontSize:24,fontWeight:800}}>{batchId}</h1>
        </div>
        <button onClick={()=>setTick(t=>t+1)} style={{padding:"8px 12px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff"}}>Refresh</button>
      </header>
            {user?.role === "consumer" && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={handleSave}>Save this batch</button>
          {saveMsg && <span style={{ marginLeft: 8 }}>{saveMsg}</span>}
        </div>
      )}


      <Section>
        <h2>Credibility</h2>
        {cred ? (
          <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <Badge value={Math.round(cred.credibilityScore)} />
            <div style={{fontSize:13}}>
              <div><strong>Score:</strong> {Math.round(cred.credibilityScore)} / 100</div>
              <div style={{marginTop:6}}>
                <Mini label="Ethics (E)" v={cred.breakdown?.E}/>
                <Mini label="Docs (C)" v={cred.breakdown?.C}/>
                <Mini label="Delivery (D)" v={cred.breakdown?.D}/>
                <Mini label="Sustainability (S)" v={cred.breakdown?.S}/>
              </div>
            </div>
          </div>
        ) : (
          <div style={{color:"#667085"}}>No credibility data yet for this batch.</div>
        )}
      </Section>

      <Section>
        <h2>On-chain Proof</h2>
        {(data?.onChain?.hashes || []).length === 0 ? (
          <div style={{color:"#667085"}}>No hashes recorded for this batch.</div>
        ) : (
          <ul style={{fontSize:12,display:"grid",gap:4}}>
            {data.onChain.hashes.map((h,i)=>(
              <li key={h+i} style={{fontFamily:"ui-monospace, Menlo, monospace",wordBreak:"break-all"}}>{h}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <h2>Lifecycle (where it went)</h2>
        {events.length===0 ? (
          <div style={{color:"#667085"}}>No events yet for this batch.</div>
        ) : (
          <ol style={{borderLeft:"1px solid #e5e7eb",paddingLeft:14}}>
            {events.map((e,idx)=>(
              <li key={(e.hash||e.eventId||idx)+""} style={{marginBottom:16}}>
                <time style={{display:"block",fontSize:12,color:"#667085"}}>
                  {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                </time>
                <div style={{fontWeight:600}}>{e.eventType || "EVENT"} {e.actor ? `• ${e.actor}` : ""}</div>
                <div style={{fontSize:12,color:"#4b5563",wordBreak:"break-all"}}>
                  {e.certificateID ? <>cert: <code>{e.certificateID}</code><br/></> : null}
                  {e.hash ? <>hash: <code>{e.hash}</code><br/></> : null}
                  {e.txHash ? <>tx: <code>{e.txHash}</code><br/></> : null}
                </div>
                {e.payload ? (
                  <pre style={{fontSize:12,background:"#f9fafb",padding:8,borderRadius:8,border:"1px solid #e5e7eb",overflow:"auto",marginTop:6}}>
                    {JSON.stringify(e.payload,null,2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Section>
      <section className="card" style={{ padding: 14, marginTop: 16, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
        <h2>Share this batch</h2>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ background:"#fff", padding:12, borderRadius:12, border:"1px solid #e5e7eb" }}>
          <QRCode value={window.location.href} size={140} />

        </div>
        <div style={{ fontSize: 12, wordBreak: "break-all" }}>
          {window.location.href}
        <div style={{ marginTop: 8 }}>
        <button
          onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); alert("Link copied ✔"); } catch {} }}
          style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
        >
          Copy link
        </button>
      </div>
    </div>
  </div>
  </section>

    </Wrap>
  );
}

/* UI helpers */
function Wrap({children}) {
  return <div className="container" style={{padding:18,maxWidth:960,margin:"0 auto"}}>{children}</div>;
}
function Section({children}) {
  return <section className="card" style={{padding:14,marginTop:16,borderRadius:12,border:"1px solid #e5e7eb",background:"#fff"}}>{children}</section>;
}
function Badge({ value }) {
  return <div title="Credibility score" style={{width:56,height:56,borderRadius:"50%",background:"#111827",color:"#fff",display:"grid",placeItems:"center",fontWeight:700}}>{value}</div>;
}
function Mini({label,v}) {
  return <div style={{fontSize:12,color:"#4b5563"}}><span style={{width:120,display:"inline-block"}}>{label}:</span> <strong>{v ?? "—"}</strong></div>;
}
