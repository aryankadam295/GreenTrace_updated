import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, DollarSign, Activity, UserCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LandVerification from './LandVerification';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Real data from APIs
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalMerchants: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      if (user?.role === 'farmer') {
        navigate('/farmer-dashboard');
      } else if (user?.role === 'merchant') {
        navigate('/merchant-dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  // State for dynamic data
  const [revenueData, setRevenueData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [topFarmers, setTopFarmers] = useState([]);
  const [topMerchants, setTopMerchants] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard analytics
      const analyticsResponse = await api.get('/admin/analytics');
      setDashboardData(analyticsResponse.data.analytics);
      setRevenueData(analyticsResponse.data.analytics.revenueData || []);

      // Fetch activity distribution
      const activityResponse = await api.get('/admin/activity-distribution');
      setActivityData(activityResponse.data.activityData);

      // Fetch top performers
      const performersResponse = await api.get('/admin/top-performers');
      setTopFarmers(performersResponse.data.topFarmers);
      setTopMerchants(performersResponse.data.topMerchants);

      // Fetch recent activities
      const activitiesResponse = await api.get('/admin/activities');
      setRecentActivities(activitiesResponse.data.activities);

      // Fetch recent transactions
      const transactionsResponse = await api.get('/admin/transactions');
      setRecentTransactions(transactionsResponse.data.transactions);

      // Fetch users for user management tab
      const usersResponse = await api.get('/admin/users');
      setAllUsers(usersResponse.data.users);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  // Loading state component
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-gray-600'}`}>
              {trend === 'up' && '↑ '}{subtitle}
            </p>
          )}
        </div>
        <div className={`${color} bg-opacity-10 rounded-full p-4`}>
          <Icon className={`${color.replace('bg-', 'text-')} w-8 h-8`} />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ label, icon: Icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GreenTrace Admin</h1>
                <p className="text-sm text-gray-600">Dashboard & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <TabButton 
            label="Overview" 
            icon={TrendingUp} 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <TabButton 
            label="Users" 
            icon={Users} 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <TabButton 
            label="Transactions" 
            icon={DollarSign} 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
          />
          <TabButton 
            label="Activities" 
            icon={Activity} 
            active={activeTab === 'activities'} 
            onClick={() => setActiveTab('activities')} 
          />
          <TabButton
            label="Land Listings"
            icon={UserCheck}
            active={activeTab === 'lands'}
            onClick={() => setActiveTab('lands')}
          />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Users"
                value={dashboardData.totalUsers.toLocaleString()}
                subtitle={`+${dashboardData.newUsersThisMonth} this month`}
                icon={Users}
                color="bg-blue-600"
                trend="up"
              />
              <StatCard
                title="Total Farmers"
                value={dashboardData.totalFarmers.toLocaleString()}
                subtitle={`${dashboardData.activeUsers} active users`}
                icon={UserCheck}
                color="bg-green-600"
              />
              <StatCard
                title="Total Merchants"
                value={dashboardData.totalMerchants.toLocaleString()}
                subtitle={`${dashboardData.completedTransactions} orders`}
                icon={Briefcase}
                color="bg-purple-600"
              />
              <StatCard
                title="Total Revenue"
                value={`₹${(dashboardData.totalRevenue / 1000).toFixed(0)}K`}
                subtitle={`Commission: ₹${(dashboardData.totalCommission / 1000).toFixed(1)}K`}
                icon={DollarSign}
                color="bg-yellow-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Trend */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Farmers */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏆 Top Farmers by Sales</h3>
                <div className="space-y-3">
                  {topFarmers.map((farmer, index) => (
                    <div key={farmer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{farmer.name}</p>
                          <p className="text-sm text-gray-600">@{farmer.username} • {farmer.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{farmer.sales.toLocaleString()}</p>
                        <p className="text-sm text-yellow-600">⭐ {farmer.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Merchants */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏆 Top Merchants by Purchases</h3>
                <div className="space-y-3">
                  {topMerchants.map((merchant, index) => (
                    <div key={merchant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{merchant.name}</p>
                          <p className="text-sm text-gray-600">@{merchant.username} • {merchant.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">₹{merchant.purchases.toLocaleString()}</p>
                        <p className="text-sm text-yellow-600">⭐ {merchant.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-l-4 border-green-600 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{activity.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">@{activity.user}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">User Management</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="merchant">Merchants</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'FARMER' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.joined}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.activities}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-green-600 hover:text-green-700 mr-3">View</button>
                        <button className="text-blue-600 hover:text-blue-700 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-700">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Transaction Management</h3>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{txn.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">@{txn.buyer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">@{txn.seller}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{txn.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{txn.commission.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Activity Logs</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search activities..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="all">All Activities</option>
                  <option value="login">Logins</option>
                  <option value="product">Product Actions</option>
                  <option value="order">Orders</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-3xl">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">@{activity.user}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="bg-gray-200 px-2 py-1 rounded">{activity.type}</span>
                        </p>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">Showing 1-8 of 2,456 activities</p>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg">1</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">2</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">3</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lands' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <LandVerification embedded />
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">System Status: <span className="font-semibold text-green-600">Online</span></span>
              </div>
              <div className="text-gray-600">
                Active Users: <span className="font-semibold">{dashboardData.activeUsers}</span>
              </div>
              <div className="text-gray-600">
                Today's Revenue: <span className="font-semibold">₹95,000</span>
              </div>
            </div>
            <div className="text-gray-500">
              Last updated: Just now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
