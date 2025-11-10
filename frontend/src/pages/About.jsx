import React from "react";
import { FaLink, FaStar, FaQrcode, FaProjectDiagram } from "react-icons/fa";
import "../styles/global.css";

export default function About() {
  return (
    <div>
{/* Hero Section */}
<section
  style={{
    background: "linear-gradient(120deg, #4caf50, #2e7d32)",
    color: "white",
    padding: "80px 20px",
    textAlign: "center",
  }}
>
  <h1 style={{ fontSize: "2.5rem", marginBottom: "15px" }}>
    About CropCred
  </h1>
  <p
    style={{
      maxWidth: 750,
      margin: "0 auto",
      fontSize: "1.15rem",
      color: "rgba(255, 255, 255, 0.9)", // ✅ fixed contrast
      lineHeight: "1.6",
    }}
  >
    CropCred is a blockchain-powered platform ensuring transparency,
    sustainability, and trust from <strong>farm to fork</strong>.
  </p>
</section>


      {/* Mission */}
      <section className="container" style={{ marginTop: 40 }}>
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <h2 className="h2">Our Mission</h2>
          <p
            style={{
              color: "#444", // darker grey for better visibility
              fontSize: "1.05rem",
              lineHeight: "1.7",
            }}
          >
            To design a <strong>secure, transparent, and sustainable
            agricultural supply chain</strong> using blockchain technology —
            improving traceability, reducing fraud, and building consumer trust
            while empowering farmers with credibility and recognition.
          </p>
        </div>
      </section>

      {/* Objectives */}
      <section className="container" style={{ marginTop: 50 }}>
        <h2 className="h2 text-center" style={{ marginBottom: 30 }}>
          Key Objectives
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
          }}
        >
          <div className="card" style={{ textAlign: "center" }}>
            <FaLink size={48} color="#4caf50" style={{ marginBottom: 12 }} />
            <h3>Blockchain Traceability</h3>
            <p style={{ color: "#555" }}>
              A tamper-proof system recording every crop lifecycle stage —
              ensuring authenticity and eliminating fraud.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <FaStar size={48} color="#4caf50" style={{ marginBottom: 12 }} />
            <h3>Credibility Scoring</h3>
            <p style={{ color: "#555" }}>
              Farmers rated on sustainability, ethical practices, and
              reliability — rewarding good practices and guiding consumers.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <FaQrcode size={48} color="#4caf50" style={{ marginBottom: 12 }} />
            <h3>Smart QR Indicators</h3>
            <p style={{ color: "#555" }}>
              Unique QR codes reveal crop origin, pesticide use, and full
              transaction history — building end-to-end trust.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <FaProjectDiagram
              size={48}
              color="#4caf50"
              style={{ marginBottom: 12 }}
            />
            <h3>Interoperability & Scalability</h3>
            <p style={{ color: "#555" }}>
              Designed to integrate with diverse stakeholders and scale
              globally — ensuring long-term adoption.
            </p>
          </div>
        </div>
      </section>

      {/* Closing Section */}
      <section
        style={{
          marginTop: 60,
          padding: "60px 20px",
          background: "#f1f8e9",
          textAlign: "center",
        }}
      >
        <h2 className="h2">Shaping the Future of Agriculture</h2>
        <p
          style={{
            maxWidth: 750,
            margin: "15px auto",
            color: "#333", // darker text here too
            lineHeight: "1.7",
          }}
        >
          CropCred bridges technology and agriculture to create a transparent
          ecosystem where <strong>farmers are empowered</strong>,{" "}
          <strong>consumers are informed</strong>, and{" "}
          <strong>trust is guaranteed</strong>.
        </p>
      </section>
    </div>
  );
}
