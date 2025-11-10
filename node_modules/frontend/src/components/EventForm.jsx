import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;

function EventForm() {
  const [eventData, setEventData] = useState({
  certificateID: "",
  eventType: "",
  notes: "",
});
const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch(`${API}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    const result = await res.json();
    setResponse(result.message || result.error || "Event recorded");
  } catch {
    setResponse("Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <input
  type="text"
  placeholder="Certificate ID"
  value={eventData.certificateID}
  onChange={(e) =>
    setEventData((prev) => ({ ...prev, certificateID: e.target.value }))
  }
/>
<select
  value={eventData.eventType}
  onChange={(e) =>
    setEventData((prev) => ({ ...prev, eventType: e.target.value }))
  }
  style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
>
  <option value="">Select Event Type</option>
  <option value="harvested">Harvested</option>
  <option value="transported">Transported</option>
  <option value="sold">Sold</option>
</select>

<textarea
  placeholder="Notes"
  value={eventData.notes}
  onChange={(e) =>
    setEventData((prev) => ({ ...prev, notes: e.target.value }))
  }
/>

      <button type="submit">Record Event</button>
      {loading && <p>Loading...</p>}
      {response && (
  <p
    style={{
      color: response === "Something went wrong" ? "red" : "green",
      fontWeight: "bold",
    }}
  >
    {response}
  </p>
)}
    </form>
  );
}

export default EventForm;
