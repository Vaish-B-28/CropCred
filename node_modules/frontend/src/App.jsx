import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import FormDashboard from "./pages/FormDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import ConsumerDashboard from "./pages/consumer/ConsumerDashboard";
import Verify from "./pages/Verify";
import PublicVerify from "./pages/PublicVerify";


// NEW: role guard (create at src/components/guards.jsx if you haven't)
import { RequireRole } from "./components/guards";

const PUBLIC_PREFIX = import.meta.env.VITE_PUBLIC_VERIFY_PREFIX || "/v";

export default function App() {
  return (
    <>
      <Navbar />

      <main style={{ paddingTop: "80px", paddingBottom: "80px" }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<FormDashboard />} />

          {/* Public QR deep-link (no auth) */}
          <Route path={`${PUBLIC_PREFIX}/batch/:batchId`} element={<PublicVerify />} />
          

          {/* Role-gated areas */}
          <Route element={<RequireRole role="farmer" />}>
            <Route path="/farmer/*" element={<FarmerDashboard />} />
          </Route>

          <Route element={<RequireRole role="consumer" />}>
            <Route path="/consumer/*" element={<ConsumerDashboard />} />
          </Route>

          {/* Optional: verify-by-certificateID page (keep if you're using it) */}
          <Route path="/verify/:certificateID" element={<Verify />} />

          {/* 404 */}
          <Route path="*" element={<h2 style={{ textAlign: "center" }}>404 - Page Not Found</h2>} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
