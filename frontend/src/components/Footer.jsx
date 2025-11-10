import React from 'react'
import "../styles/footer.css";

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>CropCred © {new Date().getFullYear()} — Blockchain for Agriculture Transparency</div>
        <div className="footer-links">
          <a href="/">Home</a> <a href="/about">About</a> <a href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  )
}
