import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Link } from 'react-router-dom';  // Importing Link from react-router-dom for navigation

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap justify-between items-center">
          {/* Left Section */}
          <div className="w-full sm:w-1/3 text-center sm:text-left mb-4 sm:mb-0">
            <p className="text-lg font-semibold">&copy; 2024 Dexter Luxuries</p>
            <p className="text-sm">All Rights Reserved</p>
          </div>

          {/* Middle Section - Links to About, Contact, Refund, and Privacy */}
          <div className="w-full sm:w-1/3 text-center sm:text-left mb-4 sm:mb-0">
            <ul className="flex justify-center sm:justify-start space-x-6">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-white transition duration-200">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Section - Social Media */}
          <div className="w-full sm:w-1/3 text-center">
            <ul className="flex justify-center sm:justify-end space-x-6">
              <li>
                <a href="https://www.instagram.com/cybermafia.shop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                  <i className="fab fa-instagram fa-lg"></i>
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/cybermafia.shop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                  <i className="fab fa-facebook fa-lg"></i>
                </a>
              </li>
              <li>
                <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                  <i className="fab fa-twitter fa-lg"></i>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                  <i className="fab fa-linkedin fa-lg"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
