// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import farmHero from "../assets/farm-hero.jpg";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* HERO */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(15,157,88,0.85), rgba(46,125,50,0.85)), url(${farmHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          padding: "80px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", gap: 40 }}
        >
          <div style={{ flex: 1, maxWidth: 720 }}>
            <h1 style={{ fontSize: "2.4rem", marginBottom: 14, lineHeight: 1.05 }}>
              CropCred — Trusted Traceability for Every Crop
            </h1>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.95)",
                marginBottom: 20,
              }}
            >
              Verify origin, farming practices, certifications and delivery—
              instantly. Built on blockchain for immutable provenance and a
              credibility score that rewards good farming.
            </p>

            {!user ? (
              <div style={{ display: "flex", gap: 12 }}>
                <Link
                  to="/auth"
                  className="btn"
                  style={{ fontSize: 16, padding: "12px 20px" }}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="btn"
                  style={{
                    background: "#ffb74d",
                    color: "#111",
                    fontSize: 16,
                    padding: "12px 20px",
                  }}
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                {user.role === "farmer" ? (
                  <Link to="/farmer" className="btn">
                    Go to Farmer Dashboard
                  </Link>
                ) : (
                  <Link to="/consumer" className="btn">
                    Go to Consumer Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>

          
        </div>
      </section>

      {/* FEATURES */}
      <section className="container" style={{ marginTop: 40 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 22,
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="h2">Why CropCred</h2>
            <p style={{ color: "var(--muted)", marginBottom: 18 }}>
              CropCred combines blockchain anchoring, smart contracts and cloud
              storage to create an auditable trail from sowing to shelf.
              Producers get recognized — consumers gain trust.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
              }}
            >
              {[
                { title: "Immutable Records", desc: "Every event anchored on chain" },
                { title: "Credibility Scores", desc: "Rewarding sustainable farming" },
                { title: "QR Verification", desc: "Fast consumer verification" },
                { title: "Cloud Storage", desc: "Certificates & images stored securely" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: 16,
                    background:
                      "linear-gradient(135deg, #f1fff1 0%, #e7f7ec 100%)",
                    border: "1px solid #c8e6c9",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <strong style={{ color: "#2e7d32" }}>{feature.title}</strong>
                  <div style={{ color: "#555", fontSize: 14 }}>{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="card"
              style={{
                padding: 20,
                background: "#fff",
                border: "1px solid #ddd",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginBottom: 12, color: "#2e7d32" }}>How it works</h3>
              <ol style={{ color: "#555", paddingLeft: 16, lineHeight: 1.6 }}>
                <li>Farmer creates a batch, uploads certificates and logs events.</li>
                <li>Events are hashed and anchored on blockchain via smart contracts.</li>
                <li>QR on pack points to the public verify page for consumers.</li>
                <li>Credibility score updates based on certifications & practices.</li>
              </ol>
              <div style={{ marginTop: 12 }}>
                <Link to="/about" className="btn small-btn">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          marginTop: 60,
          padding: "60px 20px",
          background: "linear-gradient(120deg, #319765ff, #38ae3eff)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h2 className="h2" style={{ fontSize: "2rem", marginBottom: 12 }}>
            Ready to bring trust to your produce?
          </h2>
          {!user ? (
            <Link
              to="/auth"
              className="btn"
              style={{
                marginTop: 16,
                background: "#c0f8c9ff",
                color: "#111",
                padding: "14px 26px",
                fontSize: 16,
              }}
            >
              Get Started
            </Link>
          ) : (
            <div style={{ marginTop: 16 }}>
              {user.role === "farmer" ? (
                <Link to="/farmer" className="btn">
                  Open Farmer Dashboard
                </Link>
              ) : (
                <Link to="/consumer" className="btn">
                  Open Consumer Dashboard
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
