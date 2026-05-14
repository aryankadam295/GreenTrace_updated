import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LanguageSelector from "./LanguageSelector";
import greentraceLogo from "../assets/greentrace-logo.svg";
import api, { chatAPI, equipmentAPI } from "../utils/api";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    chat: 0,
    equipment: 0,
    inquiries: 0,
    adminActivities: 0,
  });
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleProfile = () => setIsProfileOpen((prev) => !prev);
  const toggleNotifications = () => setIsNotificationOpen((prev) => !prev);

  useEffect(() => {
    if (!isAuthenticated || !user?.role) return;

    const fetchNotificationCounts = async () => {
      try {
        if (user.role === "farmer") {
          const [chatRes, equipmentRes] = await Promise.all([
            chatAPI.getUnreadCount(),
            equipmentAPI.getUnreadCount(),
          ]);
          setNotificationCounts({
            chat: Number(chatRes?.data?.unreadCount || 0),
            equipment: Number(equipmentRes?.data?.unreadCount || 0),
            inquiries: 0,
            adminActivities: 0,
          });
          return;
        }

        if (user.role === "merchant") {
          const [chatRes, inquiryRes] = await Promise.all([
            chatAPI.getUnreadCount(),
            api.get("/inquiries/merchant?status=responded&limit=1"),
          ]);
          setNotificationCounts({
            chat: Number(chatRes?.data?.unreadCount || 0),
            equipment: 0,
            inquiries: Number(inquiryRes?.data?.total || 0),
            adminActivities: 0,
          });
          return;
        }

        if (user.role === "admin") {
          const activitiesRes = await api.get("/admin/activities");
          setNotificationCounts({
            chat: 0,
            equipment: 0,
            inquiries: 0,
            adminActivities: Number(activitiesRes?.data?.activities?.length || 0),
          });
        }
      } catch {
        setNotificationCounts({ chat: 0, equipment: 0, inquiries: 0, adminActivities: 0 });
      }
    };

    fetchNotificationCounts();
    const intervalId = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user?.role]);

  const totalNotifications =
    notificationCounts.chat +
    notificationCounts.equipment +
    notificationCounts.inquiries +
    notificationCounts.adminActivities;

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="border-b border-green-100 bg-[#F7FAF2] text-green-950 shadow-sm">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        {/* Left Side - Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
          <img src={greentraceLogo} alt="GreenTrace logo" className="h-10 w-10" />
          GreenTrace
        </Link>

        {/* Right Side - Menu */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-8 pr-6">
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
                  <Link to="/farmer-dashboard?section=overview" className="hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/farmer-dashboard?section=inquiries" className="hover:text-green-700 transition">
                    Inquiries
                  </Link>
                  <Link to="/farmer-dashboard?section=chat" className="hover:text-green-700 transition">
                    Chat
                  </Link>
                  <Link to="/farmer-dashboard?section=weather" className="hover:text-green-700 transition">
                    Weather Forecast
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

              <LanguageSelector />

              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative rounded-full border border-green-100 bg-white px-3 py-2 text-green-900 shadow-sm transition hover:border-green-300 hover:bg-green-50"
                  aria-expanded={isNotificationOpen}
                  aria-label="Open notifications"
                >
                  <span className="text-base">🔔</span>
                  {totalNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-lg border border-green-100 bg-white shadow-xl">
                    <div className="border-b border-green-100 bg-[#F7FAF2] px-4 py-3">
                      <p className="font-semibold text-green-950">Notifications</p>
                    </div>
                    <div className="py-2">
                      {user?.role === "farmer" && (
                        <>
                          <Link to="/farmer-dashboard?section=chat" onClick={() => setIsNotificationOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800">
                            <span>Marketplace chat messages</span>
                            <span className="font-semibold">{notificationCounts.chat}</span>
                          </Link>
                          <Link to="/farmer-dashboard?section=equipment" onClick={() => setIsNotificationOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800">
                            <span>Equipment chat messages</span>
                            <span className="font-semibold">{notificationCounts.equipment}</span>
                          </Link>
                        </>
                      )}
                      {user?.role === "merchant" && (
                        <>
                          <Link to="/merchant-dashboard" onClick={() => setIsNotificationOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800">
                            <span>New chat messages</span>
                            <span className="font-semibold">{notificationCounts.chat}</span>
                          </Link>
                          <Link to="/merchant-dashboard" onClick={() => setIsNotificationOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800">
                            <span>Farmer inquiry replies</span>
                            <span className="font-semibold">{notificationCounts.inquiries}</span>
                          </Link>
                        </>
                      )}
                      {user?.role === "admin" && (
                        <Link to="/admin-dashboard" onClick={() => setIsNotificationOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800">
                          <span>Recent platform activities</span>
                          <span className="font-semibold">{notificationCounts.adminActivities}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={toggleProfile}
                  className="flex items-center gap-2 rounded-full border border-green-100 bg-white px-2.5 py-1.5 font-medium text-green-950 shadow-sm transition hover:border-green-300 hover:bg-green-50"
                  aria-expanded={isProfileOpen}
                  aria-label="Open profile menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-32 truncate">{user?.fullName}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-green-100 bg-white shadow-xl">
                    <div className="border-b border-green-100 bg-[#F7FAF2] px-4 py-3">
                      <p className="font-semibold text-green-950">{user?.fullName}</p>
                      <p className="text-sm capitalize text-green-700">{user?.role}</p>
                      {user?.businessName && <p className="text-xs text-gray-500">{user.businessName}</p>}
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800"
                      >
                        Profile
                      </Link>
                      {user?.role === 'farmer' && (
                        <Link
                          to="/profile?section=upi"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-green-50 hover:text-green-800"
                        >
                          UPI Settings
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!isAuthenticated && <LanguageSelector />}

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
        <div className="md:hidden border-t border-green-100 bg-[#F7FAF2] px-6 pb-4 space-y-2 text-green-950">
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
                  <Link to="/farmer-dashboard?section=overview" className="block hover:text-green-700 transition">
                    Dashboard
                  </Link>
                  <Link to="/farmer-dashboard?section=inquiries" className="block hover:text-green-700 transition">
                    Inquiries
                  </Link>
                  <Link to="/farmer-dashboard?section=chat" className="block hover:text-green-700 transition">
                    Chat
                  </Link>
                  <Link to="/farmer-dashboard?section=weather" className="block hover:text-green-700 transition">
                    Weather Forecast
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

              <div className="rounded-lg border border-green-100 bg-white p-3">
                <span className="flex items-center gap-2 text-green-950 font-medium mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span>{user?.fullName}</span>
                </span>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
                >
                  Profile
                </Link>
                {user?.role === 'farmer' && (
                  <Link
                    to="/profile?section=upi"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
                  >
                    UPI Settings
                  </Link>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="block border border-red-200 bg-red-50 text-red-700 font-semibold px-4 py-2 rounded-md hover:bg-red-100 transition w-full text-left"
              >
                Logout
              </button>
            </>
          )}

          <LanguageSelector compact />

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
