import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;

function UploadForm() {
  const [certificateID, setCertificateID] = useState("");
  const [actor, setActor] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  const formData = new FormData();
  formData.append("certificateID", certificateID);
  formData.append("actor", actor);
  formData.append("file", file); // crop metadata

  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload");
    }

    const result = await res.json();
    setMessage(result.message || "Upload complete");
  } catch (error) {
    setMessage("Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <input
  type="text"
  placeholder="Certificate ID"
  value={certificateID}
  onChange={(e) => setCertificateID(e.target.value)}
/>

<input
  type="text"
  placeholder="Actor"
  value={actor}
  onChange={(e) => setActor(e.target.value)}
/>

<input
  type="file"
  onChange={(e) => setFile(e.target.files[0])}
/>

      <button type="submit">Upload</button>
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

export default UploadForm;
