import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import EquipmentBrowse from './EquipmentBrowse';
import MyEquipment from './MyEquipment';
import MyBookings from './MyBookings';
import BookingRequests from './BookingRequests';
import EquipmentUpload from './EquipmentUpload';
import EquipmentChat from './EquipmentChat';

const EquipmentHub = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [analytics, setAnalytics] = useState(null);
  const [renterAnalytics, setRenterAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [ownerRes, renterRes] = await Promise.all([
        equipmentAPI.getAnalytics(),
        equipmentAPI.getRenterAnalytics()
      ]);
      setAnalytics(ownerRes.data.analytics);
      setRenterAnalytics(renterRes.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'browse', label: 'Browse Equipment', icon: '🔍' },
    { id: 'my-equipment', label: 'My Equipment', icon: '🚜' },
    { id: 'list-equipment', label: 'List Equipment', icon: '➕' },
    { id: 'my-bookings', label: 'My Rentals', icon: '📋' },
    { id: 'requests', label: 'Booking Requests', icon: '📥' },
    { id: 'chat', label: 'Messages', icon: '💬' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return <EquipmentBrowse />;
      case 'my-equipment':
        return <MyEquipment onRefresh={fetchAnalytics} />;
      case 'list-equipment':
        return <EquipmentUpload onSuccess={() => {
          fetchAnalytics();
          setActiveTab('my-equipment');
        }} />;
      case 'my-bookings':
        return <MyBookings onRefresh={fetchAnalytics} />;
      case 'requests':
        return <BookingRequests onRefresh={fetchAnalytics} />;
      case 'chat':
        return <EquipmentChat />;
      default:
        return <EquipmentBrowse />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          🚜 Equipment Sharing
        </h1>
        <p className="text-gray-600">
          Rent or share agricultural equipment with fellow farmers
        </p>
      </div>

      {/* Analytics Cards */}
      {!loading && (analytics || renterAnalytics) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100">
                <span className="text-xl">🚜</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">My Listings</p>
                <p className="text-xl font-bold text-gray-900">{analytics?.totalEquipment || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <span className="text-xl">📥</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Pending Requests</p>
                <p className="text-xl font-bold text-gray-900">{analytics?.pendingRequests || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100">
                <span className="text-xl">💰</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Earnings</p>
                <p className="text-xl font-bold text-gray-900">₹{analytics?.totalEarnings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100">
                <span className="text-xl">📋</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">My Rentals</p>
                <p className="text-xl font-bold text-gray-900">{renterAnalytics?.activeBookings || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
        <div className="flex border-b min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.id === 'requests' && analytics?.pendingRequests > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {analytics.pendingRequests}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {renderContent()}
      </div>
    </div>
  );
};

export default EquipmentHub;
