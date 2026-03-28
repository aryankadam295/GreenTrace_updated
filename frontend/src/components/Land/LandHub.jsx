import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import AddLand from './AddLand';
import MyLandListings from './MyLandListings';
import LandFeed from './LandFeed';

const tabConfig = {
  browse: { label: 'Browse Lands', icon: '🔍' },
  myListings: { label: 'My Listings', icon: '🏞️' },
  listLand: { label: 'List Land', icon: '➕' }
};

const LandHub = ({ initialTab = 'browse', embeddedInDashboard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState({
    verified: 0,
    mine: 0,
    pending: 0,
    verifiedMine: 0
  });

  const canManageListings = isAuthenticated && user?.role === 'farmer';

  const tabs = useMemo(() => {
    const baseTabs = [{ id: 'browse', ...tabConfig.browse }];

    if (canManageListings) {
      baseTabs.push({ id: 'myListings', ...tabConfig.myListings });
      baseTabs.push({ id: 'listLand', ...tabConfig.listLand });
    }

    return baseTabs;
  }, [canManageListings]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/my-lands' && canManageListings) {
      setActiveTab('myListings');
      return;
    }
    if (path === '/add-land' && canManageListings) {
      setActiveTab('listLand');
      return;
    }
    if (path === '/land-feed' || path === '/land-rentals') {
      setActiveTab(initialTab);
    }
  }, [location.pathname, canManageListings, initialTab]);

  useEffect(() => {
    fetchStats();
  }, [canManageListings]);

  const fetchStats = async () => {
    try {
      const verifiedPromise = api.get('/land');
      const minePromise = canManageListings ? api.get('/land/farmer/me') : Promise.resolve({ data: [] });
      const [verifiedRes, mineRes] = await Promise.all([verifiedPromise, minePromise]);

      const myListings = mineRes.data || [];
      setStats({
        verified: verifiedRes.data?.length || 0,
        mine: myListings.length,
        pending: myListings.filter((land) => land.status === 'pending').length,
        verifiedMine: myListings.filter((land) => land.status === 'verified').length
      });
    } catch (error) {
      console.error('Error fetching land rental stats:', error);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (embeddedInDashboard) {
      return;
    }
    if (tabId === 'browse') navigate('/land-rentals');
    if (tabId === 'myListings') navigate('/my-lands');
    if (tabId === 'listLand') navigate('/add-land');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'myListings':
        return <MyLandListings embedded onAddLand={() => handleTabChange('listLand')} />;
      case 'listLand':
        return <AddLand embedded onSuccess={() => {
          fetchStats();
          handleTabChange('myListings');
        }} />;
      case 'browse':
      default:
        return <LandFeed embedded />;
    }
  };

  const statCards = [
    { label: 'Verified Listings', value: stats.verified, icon: '✅', tint: 'bg-green-100' },
    { label: 'My Listings', value: canManageListings ? stats.mine : '-', icon: '🏞️', tint: 'bg-blue-100' },
    { label: 'Pending Review', value: canManageListings ? stats.pending : '-', icon: '🕒', tint: 'bg-amber-100' },
    { label: 'Approved Mine', value: canManageListings ? stats.verifiedMine : '-', icon: '📈', tint: 'bg-emerald-100' }
  ];

  return (
    <div className={embeddedInDashboard ? '' : 'min-h-screen bg-gray-50'}>
      <div className={embeddedInDashboard ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 px-6 py-8 text-white shadow-lg">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold md:text-4xl">Land Rentals</h1>
            <p className="mt-3 text-sm leading-6 text-green-50 md:text-base">
              Discover verified farmland, manage your own land listings, and keep the rental workflow in one consistent place.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center">
                <div className={`rounded-full p-2 ${card.tint}`}>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <div className="flex min-w-max border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-5 py-4 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-green-600 bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="min-h-[420px] bg-white">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default LandHub;
