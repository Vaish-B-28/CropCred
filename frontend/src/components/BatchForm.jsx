import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;

function BatchForm() {
  const [batchName, setBatchName] = useState("");
  const [certificates, setCertificates] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const certArray = certificates.split(",").map((id) => id.trim());
      const res = await fetch(`${API}/api/batch/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, certificates: certArray }),
      });

      if (!res.ok) throw new Error("Batch creation failed");
      const result = await res.json();
      setMessage(result.message || "Batch created");
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Batch Name"
        value={batchName}
        onChange={(e) => setBatchName(e.target.value)}
      />
      <textarea
        placeholder="Comma-separated Certificate IDs"
        value={certificates}
        onChange={(e) => setCertificates(e.target.value)}
      />
      <button type="submit">Create Batch</button>
      {loading && <p>Loading...</p>}
      {message && (
        <p
          style={{
            color: message === "Something went wrong" ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}

export default BatchForm;
