import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-1">
      <div className="container mx-auto px-1">
        <div className="flex flex-wrap justify-between items-center">
          {/* Left Section */}
          <div className="w-full sm:w-auto text-center sm:text-left">
            <p className="text-lg font-semibold">&copy; 2024 Dexter Luxuries</p>
            <p className="text-sm">All Rights Reserved</p>
          </div>

          {/* Middle Section */}
          <div className="w-full sm:w-auto mt-4 sm:mt-0 text-center">
            <ul className="flex justify-center space-x-6">
              
            
              <li>
                <a href="#services" className="hover:text-gray-400">Services</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-gray-400">Contact</a>
              </li>
            </ul>
          </div>

          {/* Right Section */}
          <div className="w-full sm:w-auto mt-4 sm:mt-0 text-center">
            <ul className="flex justify-center space-x-6">
            
            
              <li>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
                  <i className="fab fa-instagram"></i> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

