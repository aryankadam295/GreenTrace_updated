import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="text-green-900 shadow-md" style={{backgroundColor: '#F1F8F4'}}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left Side - Logo / Brand */}
        <Link to="/" className="text-2xl font-bold">
          GreenTrace
        </Link>

        {/* Right Side - Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {!isAuthenticated ? (
            <>
              <Link to="/" className="hover:text-green-700 transition">
                Home
              </Link>
              <Link to="/for-farmers" className="hover:text-green-700 transition">
                For Farmers
              </Link>
              <Link to="/for-merchants" className="hover:text-green-700 transition">
                For Merchants
              </Link>
              <Link to="/about" className="hover:text-green-700 transition">
                About Us
              </Link>
            </>
          ) : (
            <>
              {/* Role-specific navigation */}
              {user?.role === 'farmer' && (
                <>
                  <Link to="/farmer-dashboard" className="hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/farmer-dashboard" className="hover:text-green-700 transition">
                    My Products
                  </Link>
                  <Link to="/farmer-dashboard" className="hover:text-green-700 transition">
                    Inquiries
                  </Link>
                </>
              )}

              {user?.role === 'merchant' && (
                <>
                  <Link to="/merchant-dashboard" className="hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/merchant-dashboard" className="hover:text-green-700 transition">
                    Browse Products
                  </Link>
                  <Link to="/merchant-dashboard" className="hover:text-green-700 transition">
                    My Orders
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link to="/admin-dashboard" className="hover:text-green-700 transition">
                    Admin Dashboard
                  </Link>
                  <Link to="/admin-dashboard" className="hover:text-green-700 transition">
                    User Management
                  </Link>
                  <Link to="/admin-dashboard" className="hover:text-green-700 transition">
                    Analytics
                  </Link>
                  <Link to="/admin/verify-land" className="hover:text-green-700 transition font-medium">
                    Verify Lands
                  </Link>
                </>
              )}

              <span className="text-green-900 font-medium">
                Welcome, {user?.fullName} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="bg-white font-semibold px-4 py-2 rounded-md hover:bg-gray-100 transition"
                style={{color: '#1B5E20'}}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-green-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-800 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 space-y-2 text-green-900" style={{backgroundColor: '#F1F8F4'}}>
          {!isAuthenticated ? (
            <>
              <Link to="/" className="block hover:text-green-700 transition">
                Home
              </Link>
              <Link to="/for-farmers" className="block hover:text-green-700 transition">
                For Farmers
              </Link>
              <Link to="/for-merchants" className="block hover:text-green-700 transition">
                For Merchants
              </Link>
              <Link to="/about" className="block hover:text-green-700 transition">
                About Us
              </Link>
            </>
          ) : (
            <>
              {/* Role-specific mobile navigation */}
              {user?.role === 'farmer' && (
                <>
                  <Link to="/farmer-dashboard" className="block hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/farmer-dashboard" className="block hover:text-green-700 transition">
                    My Products
                  </Link>
                  <Link to="/farmer-dashboard" className="block hover:text-green-700 transition">
                    Inquiries
                  </Link>
                </>
              )}

              {user?.role === 'merchant' && (
                <>
                  <Link to="/merchant-dashboard" className="block hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/merchant-dashboard" className="block hover:text-green-700 transition">
                    Browse Products
                  </Link>
                  <Link to="/merchant-dashboard" className="block hover:text-green-700 transition">
                    My Orders
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link to="/admin-dashboard" className="block hover:text-green-700 transition">
                    Admin Dashboard
                  </Link>
                  <Link to="/admin-dashboard" className="block hover:text-green-700 transition">
                    User Management
                  </Link>
                  <Link to="/admin-dashboard" className="block hover:text-green-700 transition">
                    Analytics
                  </Link>
                  <Link to="/admin/verify-land" className="block hover:text-green-700 transition font-medium">
                    Verify Lands
                  </Link>
                </>
              )}

              <span className="block text-green-900 font-medium mb-2">
                Welcome, {user?.fullName} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="block bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-700 transition w-full text-left"
              >
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="block bg-white font-semibold px-4 py-2 rounded-md hover:bg-gray-100 transition mb-2"
                style={{color: '#116466'}}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block bg-green-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-800 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
