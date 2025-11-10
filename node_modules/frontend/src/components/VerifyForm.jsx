import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;

function VerifyForm() {
  const [certificateID, setCertificateID] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/verify/${certificateID}`);
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Certificate ID"
        value={certificateID}
        onChange={(e) => setCertificateID(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
      {loading && <p>Loading...</p>}
      {result && (
  <div style={{ marginTop: "1rem" }}>
    {result.error ? (
      <p style={{ color: "red", fontWeight: "bold" }}>{result.error}</p>
    ) : (
      <>
        <p style={{ color: result.valid ? "green" : "red", fontWeight: "bold" }}>
          {result.valid ? "✅ Certificate is valid" : "❌ Certificate is invalid"}
        </p>
        {result.db && (
          <div>
            <p>Owner: {result.db.ownerAddress}</p>
            <p>Issued At: {new Date(result.db.issuedAt).toLocaleString()}</p>
            <p>Tx Hash: {result.db.txHash}</p>
            <p>S3 Key: {result.db.s3Key}</p>
            <a
  href={`https://your-s3-bucket.s3.amazonaws.com/${result.db.s3Key}`}
  target="_blank"
  rel="noopener noreferrer"
>
  View Certificate
</a>

          </div>
        )}
      </>
    )}
  </div>
)}
    </div>
  );
}

export default VerifyForm;
