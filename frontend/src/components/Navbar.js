import React, { useState, useEffect } from "react";
import { FaTelegram, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../assets/lgo.jpeg";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTelegramClick = () => {
    window.open("https://t.me/cybermafia.shop", "_blank");
  };

  return (
    <header className={`navbar-root ${isScrolled ? "navbar-scrolled" : "navbar-top"}`}>
      {/* Logo */}
      <Link to="/" className="navbar-logo-link" onClick={() => setIsOpen(false)}>
        <img src={logo} alt="Dexter Luxuries Logo" className="navbar-logo-img" />
        <span className="navbar-brand">Dexter Luxuries</span>
      </Link>

      {/* Hamburger — always visible on all screen sizes */}
      <button
        className="navbar-hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Drawer */}
      <div className={`navbar-drawer ${isOpen ? "navbar-drawer--open" : ""}`}>
        <nav className="navbar-links-mobile">
          {[
            { label: "Home", to: "/" },
            { label: "About", to: "/about" },
            { label: "Contact", to: "/contact" },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="nav-link-mobile"
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button onClick={handleTelegramClick} className="navbar-tg-btn-mobile">
            <FaTelegram /> Join our Telegram
          </button>
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="navbar-overlay" onClick={() => setIsOpen(false)} />
      )}
    </header>
  );
};

export default Navbar;