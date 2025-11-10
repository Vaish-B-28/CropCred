import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;

function CredibilityViewer() {
  const [certificateID, setCertificateID] = useState("");
  const [score, setScore] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/credibility/${certificateID}`);
      if (!res.ok) throw new Error("Failed to fetch credibility");
      const data = await res.json();
      setScore(data.credibilityScore);
      setMessage("Credibility fetched successfully");
    } catch {
      setMessage("Something went wrong");
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
      <button onClick={handleFetch}>Get Credibility Score</button>
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
      {score !== null && (
  <p
    style={{
      color: score > 80 ? "green" : score > 50 ? "orange" : "red",
      fontWeight: "bold",
    }}
  >
    Credibility Score: {score}
  </p>
)}

    </div>
  );
}

export default CredibilityViewer;
