import React, { useState, useEffect } from "react";
import { FaTelegram, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../assets/lgo.jpeg"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // To track scroll position

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true); // Set background to solid when scrolled
      } else {
        setIsScrolled(false); // Set background to transparent
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTelegramClick = () => {
    window.open("https://t.me/YOUR_TELEGRAM_USERNAME", "_blank");
  };

  return (
    <header className="w-full bg-white shadow-md py-4 px-4 fixed top-0 left-0 flex justify-between items-center z-40">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        {/* Wrap logo with Link component to make it clickable */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Dexter Luxuries Logo"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full"
          />
          <h1 className="text-lg md:text-xl font-bold text-black uppercase tracking-wide">
            Dexter Luxuries
          </h1>
        </Link>
      </div>

      {/* Hamburger Menu Button (Mobile) */}
      <button
        className="md:hidden text-2xl text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Navigation Links */}
      <nav
        className={`absolute md:relative top-16 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none p-4 md:p-0 space-y-4 md:space-y-0 md:space-x-6 transition-all duration-300 ease-in-out ${
          isOpen ? "block" : "hidden md:flex"
        }`}
      >
        <Link to="/" className="block md:inline text-gray-800 hover:text-gray-600 transition">
          Home
        </Link>
        <Link to="/about" className="block md:inline text-gray-800 hover:text-gray-600 transition">
          About
        </Link>
        <Link to="/contact" className="block md:inline text-gray-800 hover:text-gray-600 transition">
          Contact
        </Link>
      </nav>

      {/* WhatsApp & Telegram Icons (Desktop View) */}
      <div className="hidden md:flex items-center space-x-4">
        
        <button
          onClick={handleTelegramClick}
          className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition duration-300 shadow-md text-xl"
        >
          <FaTelegram />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
