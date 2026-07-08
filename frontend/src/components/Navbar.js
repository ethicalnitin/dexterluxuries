import React, { useState, useEffect } from "react";
import { FaTelegram, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../assets/lgo.jpeg";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@300;400;500&display=swap');

  :root {
    --nb-bg: #05050A;
    --nb-surface: rgba(255,255,255,0.045);
    --nb-border: rgba(255,255,255,0.09);
    --nb-violet: #8B5CF6;
    --nb-cyan: #22D3EE;
    --nb-text: #F4F2FF;
    --nb-text-dim: rgba(244,242,255,0.62);
    --nb-grad: linear-gradient(92deg, #8B5CF6 0%, #22D3EE 100%);
  }

  .navbar-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 68px;
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  .navbar-top {
    background: transparent;
    border-bottom: 1px solid transparent;
  }

  .navbar-scrolled {
    background: rgba(5,5,10,0.85);
    border-bottom: 1px solid var(--nb-border);
    box-shadow: 0 4px 32px rgba(0,0,0,0.45);
    backdrop-filter: blur(14px);
  }

  .navbar-logo-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .navbar-logo-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid var(--nb-violet);
    box-shadow: 0 0 16px rgba(139,92,246,0.35);
  }

  .navbar-brand {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--nb-text);
    letter-spacing: -0.2px;
  }

  .navbar-hamburger {
    background: var(--nb-surface);
    border: 1px solid var(--nb-border);
    color: var(--nb-text);
    cursor: pointer;
    font-size: 15px;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
    z-index: 1100;
    position: relative;
    backdrop-filter: blur(8px);
  }

  .navbar-hamburger:hover {
    background: rgba(139,92,246,0.14);
    border-color: rgba(139,92,246,0.4);
    color: #C4B5FD;
  }

  .navbar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 1050;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .navbar-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 300px;
    background: #0A0A13;
    border-left: 1px solid var(--nb-border);
    z-index: 1100;
    display: flex;
    flex-direction: column;
    padding: 88px 32px 48px;
    transform: translateX(100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -8px 0 48px rgba(0,0,0,0.6);
  }

  .navbar-drawer--open {
    transform: translateX(0);
  }

  .navbar-drawer-eyebrow {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #C4B5FD;
    font-weight: 600;
    margin-bottom: 28px;
    opacity: 0.8;
  }

  .navbar-links-mobile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .nav-link-mobile {
    font-size: 1.05rem;
    font-weight: 400;
    color: var(--nb-text-dim);
    text-decoration: none;
    padding: 13px 0;
    border-bottom: 1px solid var(--nb-border);
    transition: color 0.2s, padding-left 0.2s;
    display: block;
    font-family: 'Inter', sans-serif;
  }

  .nav-link-mobile:hover {
    color: #C4B5FD;
    padding-left: 6px;
  }

  .navbar-tg-btn-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--nb-grad);
    color: #0A0A13;
    border: none;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.2px;
    padding: 14px 24px;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    margin-top: 32px;
    font-family: 'Inter', sans-serif;
  }

  .navbar-tg-btn-mobile:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(139,92,246,0.35);
  }

  .navbar-drawer-footer {
    font-size: 11px;
    color: rgba(244,242,255,0.25);
    text-align: center;
    margin-top: 28px;
    font-weight: 300;
    letter-spacing: 0.5px;
  }

  @media (max-width: 480px) {
    .navbar-root { padding: 0 20px; }
    .navbar-drawer { width: 100%; border-left: none; }
    .navbar-brand { font-size: 1rem; }
  }
`;

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Proofs & Vouches", to: "/Proofs" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleTelegramClick = () => {
    window.open("https://t.me/dexterluxuries", "_blank");
    setIsOpen(false);
  };

  return (
    <>
      <style>{style}</style>
      <header className={`navbar-root ${isScrolled ? "navbar-scrolled" : "navbar-top"}`}>
        <Link to="/" className="navbar-logo-link" onClick={() => setIsOpen(false)}>
          <img src={logo} alt="Dexter Luxuries" className="navbar-logo-img" />
          <span className="navbar-brand">Dexter Luxuries</span>
        </Link>

        <button className="navbar-hamburger" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`navbar-drawer ${isOpen ? "navbar-drawer--open" : ""}`}>
          <p className="navbar-drawer-eyebrow">Navigation</p>
          <nav className="navbar-links-mobile">
            {navLinks.map(({ label, to }) => (
              <Link key={label} to={to} className="nav-link-mobile" onClick={() => setIsOpen(false)}>
                {label}
              </Link>
            ))}
            <button onClick={handleTelegramClick} className="navbar-tg-btn-mobile">
              <FaTelegram size={16} /> Join our Telegram
            </button>
          </nav>
          <p className="navbar-drawer-footer">© 2025 Dexter Luxuries</p>
        </div>

        {isOpen && <div className="navbar-overlay" onClick={() => setIsOpen(false)} />}
      </header>
    </>
  );
};

export default Navbar;