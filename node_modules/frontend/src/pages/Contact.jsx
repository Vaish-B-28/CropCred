// src/pages/Contact.jsx
import React from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  return (
    <div>
      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(120deg, #0f9d58, #2e7d32)",
          color: "#fff",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: "2.4rem", marginBottom: 12 }}>
            Get in Touch with CropCred
          </h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.95, color: "#ebfae0ff "}}>
            Have questions, feedback, or partnership ideas?  
            We’d love to hear from you.
          </p>
        </div>
      </section>

      {/* CONTACT CONTENT */}
      <section className="container" style={{ marginTop: 40, marginBottom: 60 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 30,
            alignItems: "flex-start",
          }}
        >
          {/* Contact Info */}
          <div>
            <h2 className="h2">Contact Information</h2>
            <p style={{ color: "var(--muted)", marginBottom: 18 }}>
              Reach out to us anytime and our team will get back to you as soon
              as possible.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <Mail size={24} color="#2e7d32" />
                <div>
                  <strong>Email</strong>
                  <div style={{ fontSize: 14, color: "#555" }}>
                    support@cropcred.com
                  </div>
                </div>
              </div>

              <div
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <Phone size={24} color="#2e7d32" />
                <div>
                  <strong>Phone</strong>
                  <div style={{ fontSize: 14, color: "#555" }}>
                    +91 98765 43210
                  </div>
                </div>
              </div>

              <div
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <MapPin size={24} color="#2e7d32" />
                <div>
                  <strong>Office</strong>
                  <div style={{ fontSize: 14, color: "#555" }}>
                    123 Green Valley, Pune, India
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="h2">Send us a Message</h2>
            <form className="card" style={{ padding: 20 }}>
              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Your full name" />
              </div>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="you@example.com" />
              </div>
              <div className="form-row">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows="5"
                  placeholder="Write your message..."
                />
              </div>
              <button
                type="submit"
                className="btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <Send size={18} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
