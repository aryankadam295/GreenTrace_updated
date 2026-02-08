import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductUpload from './farmer/ProductUpload';
import ProductList from './farmer/ProductList';
import InquiryList from './farmer/InquiryList';
import Analytics from './farmer/Analytics';
import Chatbox from './farmer/Chatbox';
import EquipmentHub from './farmer/equipment/EquipmentHub';

const FarmerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Ensure only farmers can access this dashboard
    if (user?.role !== 'farmer') {
      if (user?.role === 'merchant') {
        navigate('/merchant-dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    fetchAnalytics();
  }, [isAuthenticated, user, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/products/analytics');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'upload', label: 'Upload Product', icon: '📦' },
    { id: 'products', label: 'My Products', icon: '🌾' },
    { id: 'inquiries', label: 'Inquiries', icon: '💬' },
    { id: 'chat', label: 'Chat', icon: '💭' },
    { id: 'analytics', label: 'Reports', icon: '📈' },
    { id: 'CropDiseasePrediction', label: 'Crop Disease Prediction', icon: '🔬' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview analytics={analytics} />;
      case 'upload':
        return <ProductUpload onSuccess={() => fetchAnalytics()} />;
      case 'products':
        return <ProductList />;
      case 'inquiries':
        return <InquiryList />;
      case 'chat':
        return <Chatbox />;
      case 'analytics':
        return <Analytics analytics={analytics} />;
      case 'CropDiseasePrediction':
        return <CropDiseasePrediction />;
      default:
        return <DashboardOverview analytics={analytics} />;
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
      {/* Enhanced Sidebar */}
      <div className="farmer-sidebar w-64 bg-gradient-to-b from-green-700 to-green-900 shadow-2xl">
        <div className="sidebar-header p-6 border-b border-green-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Farmer Portal</h2>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-2">Welcome, {user?.fullName}</p>
        </div>
        
        <nav className="mt-4 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item w-full flex items-center px-4 py-3 mb-2 text-left rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white text-green-700 shadow-lg font-semibold'
                  : 'text-green-50 hover:bg-green-600 hover:text-white'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-green-600">
          <div className="bg-green-800 rounded-lg p-3 text-center">
            <p className="text-xs text-green-200 mb-1">GreenTrace</p>
            <p className="text-xs text-green-300">Farm Management System</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      <style>{`
        .farmer-sidebar {
          position: relative;
          min-height: 100vh;
        }

        .sidebar-header {
          background: linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, transparent 100%);
        }

        .sidebar-item {
          position: relative;
          overflow: hidden;
        }

        .sidebar-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: #4caf50;
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .sidebar-item.bg-white::before {
          transform: scaleY(1);
        }

        .sidebar-item:hover {
          transform: translateX(4px);
        }

        .sidebar-item.bg-white {
          transform: translateX(8px);
        }

        @media (max-width: 768px) {
          .farmer-sidebar {
            width: 80px;
          }
          
          .sidebar-item span:last-child {
            display: none;
          }
          
          .sidebar-header h2,
          .sidebar-header p {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ analytics }) => {
  const quickActions = [
    { label: 'Add New Product', icon: '➕', color: 'bg-green-600', action: 'upload' },
    { label: 'View Products', icon: '👁️', color: 'bg-blue-600', action: 'products' },
    { label: 'Check Inquiries', icon: '📧', color: 'bg-purple-600', action: 'inquiries' }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Manage your products and track your farm business</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded">
            <span className="text-green-600 text-xl mr-3">✅</span>
            <div>
              <p className="font-medium">Product uploaded successfully</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded">
            <span className="text-blue-600 text-xl mr-3">👁️</span>
            <div>
              <p className="font-medium">Your tomatoes got 5 new views</p>
              <p className="text-sm text-gray-600">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded">
            <span className="text-purple-600 text-xl mr-3">💬</span>
            <div>
              <p className="font-medium">New inquiry received</p>
              <p className="text-sm text-gray-600">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
