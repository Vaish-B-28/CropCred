import React from "react";

export default function DemoOtpPrompt({ open, otp, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "grid", placeItems: "center", zIndex: 9999
    }}>
      <div style={{
        width: 360, borderRadius: 12, background: "#fff", padding: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)", fontFamily: "Inter, system-ui"
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
          <img alt="" src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" width="20" height="20"/>
          <div style={{fontWeight:700}}>Google verification</div>
        </div>
        <div style={{fontSize:14, color:"#475569", marginBottom:12}}>
          Use this verification code for CropCred login on this device:
        </div>
        <div style={{
          display:"flex", justifyContent:"center", alignItems:"center",
          fontSize:28, letterSpacing:"4px", fontWeight:800, color:"#111827",
          border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 0", background:"#f8fafc"
        }}>
          {otp || "••••••"}
        </div>
        <div style={{display:"flex", gap:8, marginTop:16, justifyContent:"flex-end"}}>
          <button onClick={async ()=>{
            try { await navigator.clipboard.writeText(otp); } catch {}
            onClose();
          }} style={{
            background:"#1a73e8", color:"#fff", border:"none", borderRadius:8,
            padding:"8px 12px", fontWeight:600, cursor:"pointer"
          }}>
            Copy & Close
          </button>
        </div>
      </div>
    </div>
  );
}
