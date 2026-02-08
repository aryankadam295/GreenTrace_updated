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

const MerchantDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Ensure only merchants can access this dashboard
    if (user?.role !== 'merchant') {
      if (user?.role === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/');
      }
      return;
    }
    
    fetchAnalytics();
  }, [isAuthenticated, user, navigate]);

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

  const sidebarItems = [
    { id: 'browse', label: 'Browse Products', icon: '🔍' },
    { id: 'cart', label: 'My Cart', icon: '🛒' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { id: 'orders', label: 'My Orders', icon: '📦' },
    { id: 'inquiries', label: 'Inquiries', icon: '💬' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return <BrowseProducts />;
      case 'cart':
        return <Cart onUpdate={() => fetchAnalytics()} />;
      case 'wishlist':
        return <Wishlist onUpdate={() => fetchAnalytics()} />;
      case 'orders':
        return <Orders />;
      case 'inquiries':
        return <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inquiries</h2>
          <p className="text-gray-600">Inquiry management coming soon...</p>
        </div>;
      case 'chat':
        return <Chatbox />;
      case 'analytics':
        return <Analytics analytics={analytics} />;
      default:
        return <BrowseProducts />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Merchant Dashboard</h2>
          <p className="text-sm text-gray-600">Welcome, {user?.fullName}</p>
          <p className="text-xs text-green-600">{user?.businessName}</p>
        </div>
        
        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-green-50 transition-colors ${
                activeTab === item.id
                  ? 'bg-green-100 border-r-4 border-green-600 text-green-700'
                  : 'text-gray-700'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {/* Show counts for cart and wishlist */}
              {item.id === 'cart' && analytics?.cartItemsCount > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-1">
                  {analytics.cartItemsCount}
                </span>
              )}
              {item.id === 'wishlist' && analytics?.wishlistItemsCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {analytics.wishlistItemsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Stats in Sidebar */}
        {analytics && (
          <div className="p-6 border-t mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders:</span>
                <span className="font-medium">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent:</span>
                <span className="font-medium text-green-600">₹{analytics.totalSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Orders:</span>
                <span className="font-medium text-yellow-600">{analytics.pendingOrders}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
