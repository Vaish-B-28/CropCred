import React, { useState } from "react";
import UploadForm from "../components/UploadForm";
import EventForm from "../components/EventForm";
import VerifyForm from "../components/VerifyForm";
import BatchForm from "../components/BatchForm";
import CredibilityViewer from "../components/CredibilityViewer";

export default function FormDashboard() {
  const [view, setView] = useState("upload");
  const forms = {
    upload: <UploadForm />,
    event: <EventForm />,
    verify: <VerifyForm />,
    batch: <BatchForm />,
    credibility: <CredibilityViewer />,
  };

  return (
    <div className="app-container">
      <h1>CropCred Dashboard</h1>
      <nav>
        {Object.keys(forms).map((key) => (
          <button key={key} onClick={() => setView(key)}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </nav>
      <main>{forms[view]}</main>
    </div>
  );
}
