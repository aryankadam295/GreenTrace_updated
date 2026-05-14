import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BrowseProducts from './merchant/BrowseProducts';
import Cart from './merchant/Cart';
import Wishlist from './merchant/Wishlist';
import Orders from './merchant/Orders';
import Analytics from './merchant/Analytics';
import Chatbox from './merchant/Chatbox';
import MerchantCommunity from './merchant/MerchantCommunity';
import AIAssistantWidget from './shared/AIAssistantWidget';
import MerchantInquiries from './merchant/MerchantInquiries'; // ✅ NEW
import MarketPrices from './MarketPrices';
import { chatAPI } from '../utils/api';

const MerchantDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInquiries, setPendingInquiries] = useState(0); // ✅ for badge
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'merchant') {
      navigate(user?.role === 'farmer' ? '/farmer-dashboard' : '/');
      return;
    }

    fetchAnalytics();
    fetchPendingInquiries(); // ✅ NEW
    fetchUnreadMessages();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'merchant') return;
    const intervalId = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/merchant/analytics');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch count of inquiries that have farmer responses (responded status)
  const fetchPendingInquiries = async () => {
    try {
      const res = await api.get('/inquiries/merchant?status=responded&limit=1');
      setPendingInquiries(res.data.total || 0);
    } catch {
      // silently fail — badge is non-critical
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      setUnreadMessages(Number(response?.data?.unreadCount || 0));
    } catch {
      setUnreadMessages(0);
    }
  };

  const sidebarItems = [
    { id: 'browse',    label: 'Browse Products', icon: '🔍' },
    { id: 'cart',      label: 'My Cart',          icon: '🛒' },
    { id: 'wishlist',  label: 'Wishlist',          icon: '❤️' },
    { id: 'orders',    label: 'My Orders',         icon: '📦' },
    { id: 'inquiries', label: 'Inquiries',          icon: '💬' },
    { id: 'community', label: 'Trade Network',      icon: '🤝' },
    { id: 'marketPrices', label: 'Live Market Prices', icon: '📍' },
    { id: 'chat',      label: 'Chat',              icon: '💭' },
    { id: 'analytics', label: 'Analytics',          icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':    return <BrowseProducts />;
      case 'cart':      return <Cart onUpdate={() => fetchAnalytics()} />;
      case 'wishlist':  return <Wishlist onUpdate={() => fetchAnalytics()} />;
      case 'orders':    return <Orders onUpdate={() => fetchAnalytics()} />;
      case 'inquiries': return <MerchantInquiries />; // ✅ REPLACED
      case 'community': return <MerchantCommunity />;
      case 'marketPrices': return <MarketPrices />;
      case 'chat':      return <Chatbox />;
      case 'analytics': return <Analytics analytics={analytics} />;
      default:          return <BrowseProducts />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F1] flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-[#214E34] to-[#123321] shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Merchant Dashboard</h2>
              <p className="text-sm text-green-100">Welcome, {user?.fullName}</p>
              <p className="text-xs text-green-200">{user?.businessName}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-[#F7FAF2] border-r-4 border-lime-300 text-[#214E34] font-semibold'
                  : 'text-green-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="flex-1">{item.label}</span>

              {/* Cart badge */}
              {item.id === 'cart' && analytics?.cartItemsCount > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {analytics.cartItemsCount}
                </span>
              )}
              {/* Wishlist badge */}
              {item.id === 'wishlist' && analytics?.wishlistItemsCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {analytics.wishlistItemsCount}
                </span>
              )}
              {/* ✅ Inquiries badge — shows count of farmer responses awaiting review */}
              {item.id === 'inquiries' && pendingInquiries > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingInquiries}
                </span>
              )}
              {item.id === 'chat' && unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        {analytics && (
          <div className="p-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-green-100 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-100">Total Orders:</span>
                <span className="font-medium text-white">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Total Spent:</span>
                <span className="font-medium text-lime-200">₹{analytics.totalSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Pending Orders:</span>
                <span className="font-medium text-amber-200">{analytics.pendingOrders}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex items-center justify-end gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative rounded-full border border-green-200 bg-white p-2 text-green-800 transition hover:bg-green-50"
                title="View notifications"
              >
                <span className="text-lg leading-none">🔔</span>
                {(unreadMessages + pendingInquiries) > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                    {(unreadMessages + pendingInquiries) > 99 ? '99+' : (unreadMessages + pendingInquiries)}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-green-100 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-sm font-semibold text-gray-900">Notifications</p>
                  <button onClick={() => { setActiveTab('chat'); setShowNotifications(false); }} className="mb-2 flex w-full items-center justify-between rounded-md bg-green-50 px-3 py-2 text-left text-sm text-green-800 hover:bg-green-100">
                    <span>New chat messages</span>
                    <span className="font-semibold">{unreadMessages}</span>
                  </button>
                  <button onClick={() => { setActiveTab('inquiries'); setShowNotifications(false); }} className="mb-2 flex w-full items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-left text-sm text-blue-800 hover:bg-blue-100">
                    <span>Farmer inquiry replies</span>
                    <span className="font-semibold">{pendingInquiries}</span>
                  </button>
                  <button onClick={() => { setActiveTab('orders'); setShowNotifications(false); }} className="flex w-full items-center justify-between rounded-md bg-purple-50 px-3 py-2 text-left text-sm text-purple-800 hover:bg-purple-100">
                    <span>Pending orders</span>
                    <span className="font-semibold">{analytics?.pendingOrders || 0}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-100 bg-white px-3 py-1.5 shadow-sm">
              <span className="text-lg">👤</span>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-800">{user?.fullName}</p>
                <p className="text-[11px] text-gray-500">Merchant</p>
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
      <AIAssistantWidget role="merchant" />
    </div>
  );
};

export default MerchantDashboard;
