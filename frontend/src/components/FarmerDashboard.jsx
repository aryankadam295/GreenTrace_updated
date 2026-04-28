import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductUpload from './farmer/ProductUpload';
import ProductList from './farmer/ProductList';
import InquiryList from './farmer/InquiryList';
import Analytics from './farmer/Analytics';
import Chatbox from './farmer/Chatbox';
import EquipmentHub from './farmer/equipment/EquipmentHub';
import CropDiseasePrediction from './farmer/CropDiseasePrediction';
import LandHub from './Land/LandHub';
import UpiSettings from './farmer/UpiSettings';
import RecentActivities from './farmer/RecentActivities';
import GovernmentSchemes from './farmer/GovernmentSchemes';
import MarketPrices from './MarketPrices';

const FarmerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);       // product txns
  const [equipmentTxns, setEquipmentTxns] = useState([]);    // ✅ equipment txns
  const [loading, setLoading] = useState(true);
  const [activityRefresh, setActivityRefresh] = useState(0);
 

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user?.role !== 'farmer') {
      navigate(user?.role === 'merchant' ? '/merchant-dashboard' : '/');
      return;
    }
    Promise.all([fetchAnalytics(), fetchSuccessfulTransactions(), fetchEquipmentIncome()]);
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section');
    if (section) setActiveTab(section);
  }, [location.search]);

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

  const fetchSuccessfulTransactions = async () => {
    try {
      const response = await api.get('/payments/farmer-transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching product transactions:', error);
    }
  };

  // ✅ NEW
  const fetchEquipmentIncome = async () => {
    try {
      const response = await api.get('/payments/equipment-rental-income');
      setEquipmentTxns(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching equipment income:', error);
    }
  };

  const sidebarItems = [
    { id: 'overview',              label: 'Overview',               icon: '📊' },
    { id: 'upload',                label: 'Upload Product',          icon: '📦' },
    { id: 'products',              label: 'My Products',             icon: '🌾' },
    { id: 'inquiries',             label: 'Inquiries',               icon: '💬' },
    { id: 'upi',                   label: 'UPI Settings',            icon: '💳' },
    { id: 'chat',                  label: 'Chat',                    icon: '💭' },
    { id: 'analytics',             label: 'Reports',                 icon: '📈' },
    { id: 'equipment',             label: 'Equipment Hub',           icon: '🚜' },
    { id: 'landRentals',           label: 'Land Rentals',            icon: '🏞️' },
    { id: 'CropDiseasePrediction', label: 'Crop Disease Prediction', icon: '🔬' },
    { id: 'governmentSchemes',     label: 'Government Schemes',      icon: '🏛️' },
    { id: 'marketPrices',          label: 'Live Market Prices',      icon: '📍' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview
            analytics={analytics}
            transactions={transactions}
            equipmentTxns={equipmentTxns}
            setActiveTab={setActiveTab}
            activityRefresh={activityRefresh}
          />
        );
      case 'upload':
        return (
          <ProductUpload
            onSuccess={() => {
              fetchAnalytics();
              setActivityRefresh((prev) => prev + 1);
            }}
          />
        );
      case 'products':             return <ProductList />;
      case 'inquiries':            return <InquiryList />;
      case 'upi':                  return <UpiSettings />;
      case 'chat':                 return <Chatbox />;
      case 'analytics':            return <Analytics analytics={analytics} />;
      case 'equipment':            return <EquipmentHub />;
      case 'landRentals':          return <LandHub embeddedInDashboard />;
      case 'CropDiseasePrediction':return <CropDiseasePrediction />;
      case 'governmentSchemes':    return <GovernmentSchemes />;
      case 'marketPrices':         return <MarketPrices />;
      default:
        return (
          <DashboardOverview
            analytics={analytics}
            transactions={transactions}
            equipmentTxns={equipmentTxns}
            setActiveTab={setActiveTab}
            activityRefresh={activityRefresh}
          />
        );
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
    <div className="min-h-screen bg-gray-50 flex">
      <div className="farmer-sidebar w-64 bg-gradient-to-b from-green-700 to-green-900 shadow-2xl">
        <div className="sidebar-header p-6 border-b border-green-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <h2 className="text-xl font-bold text-white">Farmer Portal</h2>
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

        <div className="absolute bottom-0 w-64 p-4 border-t border-green-600">
          <div className="bg-green-800 rounded-lg p-3 text-center">
            <p className="text-xs text-green-200 mb-1">GreenTrace</p>
            <p className="text-xs text-green-300">Farm Management System</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">{renderContent()}</div>
      </div>

      <style>{`
        .farmer-sidebar { position: relative; min-height: 100vh; }
        .sidebar-header { background: linear-gradient(135deg, rgba(46,125,50,0.1) 0%, transparent 100%); }
        .sidebar-item { position: relative; overflow: hidden; }
        .sidebar-item::before {
          content: ''; position: absolute; left: 0; top: 0;
          height: 100%; width: 4px; background: #4caf50;
          transform: scaleY(0); transition: transform 0.3s ease;
        }
        .sidebar-item.bg-white::before { transform: scaleY(1); }
        .sidebar-item:hover { transform: translateX(4px); }
        .sidebar-item.bg-white { transform: translateX(8px); }
        @media (max-width: 768px) {
          .farmer-sidebar { width: 80px; }
          .sidebar-item span:last-child,
          .sidebar-header h2,
          .sidebar-header p { display: none; }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// Dashboard Overview
// ─────────────────────────────────────────────
const DashboardOverview = ({ analytics, transactions, equipmentTxns, setActiveTab, activityRefresh }) => {
  // ✅ Revenue from both sources
  const productRevenue   = transactions
    .filter(t => t.paymentStatus === 'paid')
    .reduce((s, t) => s + (t.receivedAmount || 0), 0);
  const equipmentRevenue = equipmentTxns
    .reduce((s, t) => s + (t.receivedAmount || 0), 0);
  const totalRevenue     = productRevenue + equipmentRevenue;

  const quickActions = [
    { label: 'Add New Product', icon: '➕', color: 'bg-green-600',  action: 'upload'    },
    { label: 'View Products',   icon: '👁️', color: 'bg-blue-600',   action: 'products'  },
    { label: 'Check Inquiries', icon: '📧', color: 'bg-purple-600', action: 'inquiries' },
    { label: 'UPI Settings',    icon: '💳', color: 'bg-yellow-500', action: 'upi'       },
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
              <div className="p-3 rounded-full bg-green-100"><span className="text-2xl">📦</span></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100"><span className="text-2xl">👁️</span></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100"><span className="text-2xl">💬</span></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInquiries}</p>
              </div>
            </div>
          </div>

          {/* ✅ UPDATED Revenue Card — combined total + breakdown pills */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-3">
              <div className="p-3 rounded-full bg-yellow-100"><span className="text-2xl">💰</span></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                📦 ₹{productRevenue.toFixed(2)}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                🚜 ₹{equipmentRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* UPI Status Banner */}
      <UpiStatusBanner onSetupClick={() => setActiveTab('upi')} />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(action.action)}
              className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Recent Activities */}
       <RecentActivities refreshTrigger={activityRefresh} /> 

      {/* ✅ UPDATED Successful Transactions — both product + equipment */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Successful Transactions</h2>
          <button
            onClick={() => setActiveTab('inquiries')}
            className="text-xs text-green-600 hover:underline"
          >
            View all →
          </button>
        </div>

        {/* Revenue summary row */}
        {(transactions.length > 0 || equipmentTxns.length > 0) && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-green-700">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">📦 Products</p>
              <p className="text-lg font-bold text-green-700">₹{productRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{transactions.filter(t => t.paymentStatus === 'paid').length} order(s)</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">🚜 Equipment</p>
              <p className="text-lg font-bold text-blue-700">₹{equipmentRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{equipmentTxns.length} rental(s)</p>
            </div>
          </div>
        )}

        {transactions.length === 0 && equipmentTxns.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No successful payment transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {/* Product transactions (latest 3) */}
            {transactions.filter(t => t.paymentStatus === 'paid').slice(0, 3).map((txn) => (
              <div key={txn.orderId} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Order #{txn.orderId}</p>
                    <p className="text-xs text-gray-500">
                      Paid by {txn.merchantName} · 📦 Product ·{' '}
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleDateString('en-IN') : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">₹{Number(txn.receivedAmount || 0).toFixed(2)}</p>
                  <p className="text-xs text-green-600">✅ Paid</p>
                </div>
              </div>
            ))}

            {/* Equipment transactions (latest 3) */}
            {equipmentTxns.slice(0, 3).map((txn, i) => (
              <div key={txn.bookingId || i} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚜</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{txn.equipmentName}</p>
                    <p className="text-xs text-gray-500">
                      Rented by {txn.renterName} · {txn.totalDays} day(s) ·{' '}
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleDateString('en-IN') : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">₹{Number(txn.receivedAmount || 0).toFixed(2)}</p>
                  <p className="text-xs text-blue-600">✅ Paid</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// UPI Status Banner
// ─────────────────────────────────────────────
const UpiStatusBanner = ({ onSetupClick }) => {
  const [upiId, setUpiId] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.get('/users/my-upi')
      .then((res) => setUpiId(res.data.upiId))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  if (upiId) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6">
        <span className="text-xl">✅</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">UPI ID is active</p>
          <p className="text-xs text-green-600">Merchants will pay to: <span className="font-mono">{upiId}</span></p>
        </div>
        <button onClick={onSetupClick} className="text-xs text-green-700 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-3 mb-6">
      <span className="text-xl">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-800">UPI ID not set</p>
        <p className="text-xs text-yellow-700">Merchants cannot pay you until you add your UPI ID.</p>
      </div>
      <button onClick={onSetupClick} className="text-xs text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-lg transition-colors font-medium">
        Set up now
      </button>
    </div>
  );
};

export default FarmerDashboard;
