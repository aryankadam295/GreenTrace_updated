import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="text-white py-6" style={{ backgroundColor: '#00695C' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} GreenTrace. All rights reserved.
        </p>
        <div className="space-x-4">
          <Link to="/about" className="hover:text-green-300 transition">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-green-300 transition">
            Contact
          </Link>
          <Link to="/privacy" className="hover:text-green-300 transition">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
