import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, DollarSign, Activity, UserCheck, Briefcase, X, AlertTriangle, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LandVerification from './LandVerification';

// ─────────────────────────────────────────────
// Modal: View User Detail
// ─────────────────────────────────────────────
const ViewUserModal = ({ user, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${user._id}`)
      .then(r => setDetail(r.data))
      .catch(() => setDetail({ user, stats: {} }))
      .finally(() => setLoading(false));
  }, [user._id]);

  const u = detail?.user || user;
  const stats = detail?.stats || {};

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            👤 User Profile
          </h2>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={spinnerStyle} />
            <p style={{ color: '#6B7280', marginTop: 12 }}>Loading details...</p>
          </div>
        ) : (
          <>
            {/* Identity */}
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: u.role === 'farmer' ? '#DCFCE7' : '#EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>
                  {u.role === 'farmer' ? '🌾' : '🏪'}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#111827' }}>{u.fullName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>{u.email}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={pill(u.role === 'farmer' ? 'green' : 'purple')}>{u.role}</span>
                    {u.isSuspended
                      ? <span style={pill('red')}>🚫 Suspended</span>
                      : <span style={pill('green')}>✅ Active</span>}
                    {u.isVerified && <span style={pill('blue')}>✔ Verified</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Phone', value: u.phoneNumber },
                  { label: 'Joined', value: new Date(u.createdAt).toLocaleDateString('en-IN') },
                  u.role === 'farmer' && { label: 'Location', value: `${u.village || ''}, ${u.district || ''}, ${u.state || ''}` },
                  u.role === 'farmer' && { label: 'UPI ID', value: u.upiId || 'Not set' },
                  u.role === 'merchant' && { label: 'Business', value: u.businessName },
                  u.role === 'merchant' && { label: 'Type', value: u.businessType },
                  u.isSuspended && { label: 'Suspend Reason', value: u.suspendReason || '-' },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ background: 'white', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 14, color: '#111827', wordBreak: 'break-all' }}>{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 13, color: '#15803D' }}>📊 Activity Stats</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {u.role === 'farmer' && [
                  { label: 'Products', value: stats.productCount ?? '—' },
                  { label: 'Inquiries', value: stats.inquiryCount ?? '—' },
                  { label: 'Revenue', value: stats.totalRevenue != null ? `₹${stats.totalRevenue.toLocaleString()}` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'white', borderRadius: 8, padding: 12 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#16A34A' }}>{s.value}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>{s.label}</p>
                  </div>
                ))}
                {u.role === 'merchant' && [
                  { label: 'Orders', value: stats.orderCount ?? '—' },
                  { label: 'Inquiries', value: stats.inquiryCount ?? '—' },
                  { label: 'Total Spent', value: stats.totalSpent != null ? `₹${stats.totalSpent.toLocaleString()}` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'white', borderRadius: 8, padding: 12 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#7C3AED' }}>{s.value}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <button onClick={onClose} style={{ ...actionBtn('gray'), marginTop: 20, width: '100%' }}>Close</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal: Edit User
// ─────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    isVerified: user.isVerified || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      const res = await api.put(`/admin/users/${user._id}`, form);
      setSuccess('User updated successfully!');
      setTimeout(() => { onSaved(res.data.user); onClose(); }, 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>✏️ Edit User</h2>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#DCFCE7', color: '#15803D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ✅ {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', key: 'fullName', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Phone Number', key: 'phoneNumber', type: 'tel' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="isVerified"
              checked={form.isVerified}
              onChange={e => setForm(f => ({ ...f, isVerified: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#16A34A' }}
            />
            <label htmlFor="isVerified" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>
              Mark as Verified
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ ...actionBtn('gray'), flex: 1 }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ ...actionBtn('green'), flex: 2, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal: Suspend / Unsuspend User
// ─────────────────────────────────────────────
const SuspendUserModal = ({ user, onClose, onToggled }) => {
  const isSuspended = user.isSuspended;
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (!isSuspended && !reason.trim()) {
      setError('Please provide a reason for suspension.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await api.patch(`/admin/users/${user._id}/suspend`, { reason });
      onToggled(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isSuspended ? '#15803D' : '#B91C1C' }}>
            {isSuspended ? '✅ Reinstate User' : '🚫 Suspend User'}
          </h2>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {/* Warning box */}
        <div style={{
          background: isSuspended ? '#F0FDF4' : '#FFF1F2',
          border: `1.5px solid ${isSuspended ? '#BBF7D0' : '#FECDD3'}`,
          borderRadius: 10, padding: 16, marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={20} color={isSuspended ? '#16A34A' : '#DC2626'} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: isSuspended ? '#15803D' : '#B91C1C' }}>
              {isSuspended
                ? `Reinstate ${user.fullName}?`
                : `Suspend ${user.fullName}?`}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              {isSuspended
                ? 'The user will regain full access to the platform immediately.'
                : 'The user will be immediately blocked from logging in and all their activities will be halted.'}
            </p>
          </div>
        </div>

        {/* User info row */}
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{user.fullName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>{user.email} · {user.role}</p>
          {isSuspended && user.suspendReason && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#DC2626' }}>
              Suspended reason: {user.suspendReason}
            </p>
          )}
        </div>

        {/* Reason input (only when suspending) */}
        {!isSuspended && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason for Suspension *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Suspicious activity, fake listings, fraudulent transactions..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            />
          </div>
        )}

        {error && (
          <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...actionBtn('gray'), flex: 1 }}>Cancel</button>
          <button
            onClick={handleToggle}
            disabled={loading}
            style={{
              ...actionBtn(isSuspended ? 'green' : 'red'),
              flex: 2, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Processing...'
              : isSuspended ? '✅ Reinstate User' : '🚫 Suspend User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Shared style helpers
// ─────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};
const modalStyle = {
  background: 'white', borderRadius: 16, padding: 28,
  width: '100%', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
const closeBtn = {
  background: '#F3F4F6', border: 'none', borderRadius: 8,
  padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB',
  borderRadius: 8, fontSize: 14, color: '#111827', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
};
const spinnerStyle = {
  width: 32, height: 32, borderRadius: '50%',
  border: '3px solid #D1D5DB', borderTopColor: '#16A34A',
  animation: 'spin 0.8s linear infinite', margin: '0 auto',
};
const actionBtn = (color) => {
  const map = {
    green: { background: '#16A34A', color: 'white' },
    red:   { background: '#DC2626', color: 'white' },
    gray:  { background: '#F3F4F6', color: '#374151' },
  };
  return {
    padding: '10px 16px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
    transition: 'opacity 0.2s',
    ...map[color],
  };
};
const pill = (color) => {
  const map = {
    green:  { background: '#DCFCE7', color: '#15803D' },
    purple: { background: '#EDE9FE', color: '#6D28D9' },
    blue:   { background: '#DBEAFE', color: '#1D4ED8' },
    red:    { background: '#FEE2E2', color: '#B91C1C' },
  };
  return {
    fontSize: 11, fontWeight: 700, padding: '2px 8px',
    borderRadius: 20, ...map[color],
  };
};

// ─────────────────────────────────────────────
// Main AdminDashboard Component
// ─────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modal state
  const [viewUser, setViewUser]       = useState(null);
  const [editUser, setEditUser]       = useState(null);
  const [suspendUser, setSuspendUser] = useState(null);

  // Data state
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0, totalFarmers: 0, totalMerchants: 0,
    newUsersThisMonth: 0, activeUsers: 0,
    totalTransactions: 0, completedTransactions: 0,
    totalRevenue: 0, totalCommission: 0,
  });
  const [revenueData, setRevenueData]           = useState([]);
  const [activityData, setActivityData]         = useState([]);
  const [topFarmers, setTopFarmers]             = useState([]);
  const [topMerchants, setTopMerchants]         = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allUsers, setAllUsers]                 = useState([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user?.role !== 'admin') {
      navigate(user?.role === 'farmer' ? '/farmer-dashboard' : user?.role === 'merchant' ? '/merchant-dashboard' : '/');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    const intervalId = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analytics, activity, performers, activities, transactions, users] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/activity-distribution'),
        api.get('/admin/top-performers'),
        api.get('/admin/activities'),
        api.get('/admin/transactions'),
        api.get('/admin/users'),
      ]);
      setDashboardData(analytics.data.analytics);
      setRevenueData(analytics.data.analytics.revenueData || []);
      setActivityData(activity.data.activityData);
      setTopFarmers(performers.data.topFarmers);
      setTopMerchants(performers.data.topMerchants);
      setRecentActivities(activities.data.activities);
      setAlertCount((activities.data.activities || []).length);
      setRecentTransactions(transactions.data.transactions);
      setAllUsers(users.data.users);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // After edit: update local list
  const handleUserSaved = useCallback((updated) => {
    setAllUsers(prev => prev.map(u => u._id === updated._id ? { ...u, ...updated } : u));
  }, []);

  // After suspend toggle: update local list + badge
  const handleSuspendToggled = useCallback(({ isSuspended }) => {
    setAllUsers(prev => prev.map(u =>
      u._id === suspendUser._id
        ? { ...u, isSuspended, status: isSuspended ? 'Suspended' : 'Active' }
        : u
    ));
  }, [suspendUser]);

  const filteredUsers = allUsers.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phoneNumber?.includes(q);
    return matchRole && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
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
        active ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F6F8F1]">
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* ── Modals ── */}
      {viewUser    && <ViewUserModal    user={viewUser}    onClose={() => setViewUser(null)} />}
      {editUser    && <EditUserModal    user={editUser}    onClose={() => setEditUser(null)}    onSaved={handleUserSaved} />}
      {suspendUser && <SuspendUserModal user={suspendUser} onClose={() => setSuspendUser(null)} onToggled={handleSuspendToggled} />}

      <header className="hidden bg-[#F7FAF2] border-b border-green-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#214E34] rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-950">GreenTrace Admin</h1>
                <p className="text-sm text-green-700">Dashboard & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative rounded-lg border border-green-200 bg-white p-2 text-green-800 hover:bg-green-50"
                  title="View notifications"
                >
                  <Bell className="h-5 w-5" />
                  {alertCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-green-100 bg-white p-3 shadow-lg">
                    <p className="mb-2 text-sm font-semibold text-gray-900">Notifications</p>
                    <button onClick={() => { setActiveTab('activities'); setShowNotifications(false); }} className="mb-2 flex w-full items-center justify-between rounded-md bg-green-50 px-3 py-2 text-left text-sm text-green-800 hover:bg-green-100">
                      <span>Recent platform activities</span>
                      <span className="font-semibold">{recentActivities.length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('transactions'); setShowNotifications(false); }} className="mb-2 flex w-full items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-left text-sm text-blue-800 hover:bg-blue-100">
                      <span>Total transactions</span>
                      <span className="font-semibold">{dashboardData.totalTransactions || 0}</span>
                    </button>
                    <button onClick={() => { setActiveTab('users'); setShowNotifications(false); }} className="flex w-full items-center justify-between rounded-md bg-purple-50 px-3 py-2 text-left text-sm text-purple-800 hover:bg-purple-100">
                      <span>New users this month</span>
                      <span className="font-semibold">{dashboardData.newUsersThisMonth || 0}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-green-100 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-base">👤</span>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800">{user?.fullName}</p>
                  <p className="text-[11px] text-gray-500">Admin</p>
                </div>
              </div>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
              <button className="px-4 py-2 bg-[#214E34] text-white rounded-lg hover:bg-[#123321] transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <TabButton label="Overview"      icon={TrendingUp} active={activeTab === 'overview'}      onClick={() => setActiveTab('overview')} />
          <TabButton label="Users"         icon={Users}      active={activeTab === 'users'}         onClick={() => setActiveTab('users')} />
          <TabButton label="Transactions"  icon={DollarSign} active={activeTab === 'transactions'}  onClick={() => setActiveTab('transactions')} />
          <TabButton label="Activities"    icon={Activity}   active={activeTab === 'activities'}    onClick={() => setActiveTab('activities')} />
          <TabButton label="Land Listings" icon={UserCheck}  active={activeTab === 'lands'}         onClick={() => setActiveTab('lands')} />
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard title="Total Users"      value={dashboardData.totalUsers.toLocaleString()}    subtitle={`+${dashboardData.newUsersThisMonth} this month`} icon={Users}    color="bg-blue-600"   trend="up" />
              <StatCard title="Total Farmers"    value={dashboardData.totalFarmers.toLocaleString()}  subtitle={`${dashboardData.activeUsers} active`}            icon={UserCheck} color="bg-green-600" />
              <StatCard title="Total Merchants"  value={dashboardData.totalMerchants.toLocaleString()} subtitle={`${dashboardData.completedTransactions} orders`} icon={Briefcase} color="bg-purple-600" />
              <StatCard title="Total Revenue"    value={`₹${(dashboardData.totalRevenue / 1000).toFixed(0)}K`} subtitle={`Commission: ₹${(dashboardData.totalCommission / 1000).toFixed(1)}K`} icon={DollarSign} color="bg-yellow-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(v) => `₹${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={activityData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                      {activityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏆 Top Farmers by Sales</h3>
                <div className="space-y-3">
                  {topFarmers.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{f.name}</p>
                          <p className="text-sm text-gray-600">{f.orders} orders</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">₹{f.sales?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏆 Top Merchants by Purchases</h3>
                <div className="space-y-3">
                  {topMerchants.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
                          <p className="text-sm text-gray-600">{m.orders} orders</p>
                        </div>
                      </div>
                      <p className="font-bold text-purple-600">₹{m.purchases?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
              <div className="space-y-3">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 border-l-4 border-green-600 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{a.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">@{a.user}</p>
                        <p className="text-sm text-gray-600">{a.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">User Management
                <span className="ml-3 text-sm font-normal text-gray-500">({filteredUsers.length} users)</span>
              </h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
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
                    {['User', 'Role', 'Status', 'Joined', 'Activities', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u._id} className={`hover:bg-gray-50 ${u.isSuspended ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{u.fullName}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                          <p className="text-sm text-gray-400">{u.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.isSuspended
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {u.isSuspended ? '🚫 Suspended' : '✅ Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.activities ?? 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => setViewUser(u)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                          >
                            👁 View
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => setEditUser(u)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          {/* Suspend / Reinstate */}
                          <button
                            onClick={() => setSuspendUser(u)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              u.isSuspended
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            }`}
                          >
                            {u.isSuspended ? '✅ Reinstate' : '🚫 Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Transactions Tab ── */}
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
                    {['Transaction ID', 'Buyer', 'Seller', 'Amount', 'Commission', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">{txn.id}</td>
                      <td className="px-6 py-4 text-sm">@{txn.buyer}</td>
                      <td className="px-6 py-4 text-sm">@{txn.seller}</td>
                      <td className="px-6 py-4 text-sm font-semibold">₹{txn.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{txn.commission?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          txn.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>{txn.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Activities Tab ── */}
        {activeTab === 'activities' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6">Activity Logs</h3>
            <div className="space-y-4">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-3xl">{a.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">@{a.user}</p>
                        <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                        <span className="inline-block mt-1 text-xs bg-gray-200 px-2 py-0.5 rounded">{a.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Land Listings Tab ── */}
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
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-600">System Status: <span className="font-semibold text-green-600">Online</span></span>
              </div>
              <div className="text-gray-600">Active Users: <span className="font-semibold">{dashboardData.activeUsers}</span></div>
            </div>
            <div className="text-gray-500">Last updated: Just now</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
