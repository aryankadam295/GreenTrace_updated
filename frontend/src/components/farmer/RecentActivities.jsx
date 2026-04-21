// ─────────────────────────────────────────────────────────────────────────────
// FILE: frontend/src/components/farmer/RecentActivities.jsx
// Drop-in replacement for the hardcoded "Recent Activity" section.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

// ── Colour map ─────────────────────────────────────────────────────────────
const COLOR = {
  green:  { bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A', badge: '#DCFCE7', badgeText: '#15803D' },
  blue:   { bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB', badge: '#DBEAFE', badgeText: '#1D4ED8' },
  purple: { bg: '#FAF5FF', border: '#E9D5FF', icon: '#7C3AED', badge: '#EDE9FE', badgeText: '#6D28D9' },
  indigo: { bg: '#EEF2FF', border: '#C7D2FE', icon: '#4338CA', badge: '#E0E7FF', badgeText: '#3730A3' },
  teal:   { bg: '#F0FDFA', border: '#99F6E4', icon: '#0D9488', badge: '#CCFBF1', badgeText: '#0F766E' },
  yellow: { bg: '#FEFCE8', border: '#FEF08A', icon: '#CA8A04', badge: '#FEF9C3', badgeText: '#A16207' },
  orange: { bg: '#FFF7ED', border: '#FED7AA', icon: '#EA580C', badge: '#FFEDD5', badgeText: '#C2410C' },
  red:    { bg: '#FFF1F2', border: '#FECDD3', icon: '#DC2626', badge: '#FEE2E2', badgeText: '#B91C1C' },
  gray:   { bg: '#F9FAFB', border: '#E5E7EB', icon: '#6B7280', badge: '#F3F4F6', badgeText: '#374151' },
};

// ── Relative time helper ───────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000; // seconds
  if (diff < 60)  return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Type filter tabs ───────────────────────────────────────────────────────
const TABS = [
  { key: 'all',               label: 'All',       icon: '🔔' },
  { key: 'order',             label: 'Orders',    icon: '💰' },
  { key: 'equipment_booking', label: 'Equipment', icon: '🚜' },
  { key: 'product',           label: 'Products',  icon: '📦' },
  { key: 'inquiry',           label: 'Inquiries', icon: '💬' },
  { key: 'land',              label: 'Land',      icon: '🏞️' },
];

// ── Single activity row ────────────────────────────────────────────────────
const ActivityRow = ({ activity, isNew }) => {
  const c = COLOR[activity.color] || COLOR.gray;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 12,
        background: isNew ? c.bg : '#FAFAFA',
        border: `1.5px solid ${isNew ? c.border : '#F0F0F0'}`,
        transition: 'all 0.25s ease',
        animation: isNew ? 'slideIn 0.35s ease' : 'none',
      }}
    >
      {/* Icon bubble */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: c.bg, border: `1.5px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {activity.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1A1A2E', lineHeight: 1.4 }}>
            {activity.title}
          </span>
          {activity.badge && (
            <span style={{
              background: c.badge, color: c.badgeText,
              fontSize: 10.5, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              {activity.badge}
            </span>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6B7280', lineHeight: 1.4 }}>
          {activity.subtitle}
        </p>
      </div>

      {/* Time */}
      <span style={{ fontSize: 11.5, color: '#9CA3AF', whiteSpace: 'nowrap', paddingTop: 2 }}>
        {timeAgo(activity.timestamp)}
      </span>
    </div>
  );
};

// ── Skeleton loader ────────────────────────────────────────────────────────
const Skeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{
        height: 64, borderRadius: 12, background: '#F3F4F6',
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: `${i * 0.1}s`,
      }} />
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const RecentActivities = ({ refreshTrigger }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newIds, setNewIds] = useState(new Set());
  const [lastFetch, setLastFetch] = useState(null);
  const [polling, setPolling] = useState(false);

  const fetchActivities = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/recent-activities');
      const incoming = data.activities || [];

      setActivities(prev => {
        // Mark truly new items (not seen before)
        const prevTimestamps = new Set(prev.map(a => a.timestamp + a.title));
        const fresh = new Set(
          incoming
            .filter(a => !prevTimestamps.has(a.timestamp + a.title))
            .map(a => a.timestamp + a.title)
        );
        if (fresh.size > 0) setNewIds(fresh);
        return incoming;
      });

      setLastFetch(new Date());
    } catch (err) {
      setError('Could not load activities. Check your connection.');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // Re-fetch when parent triggers (e.g. product uploaded)
  useEffect(() => {
    if (refreshTrigger) fetchActivities(true);
  }, [refreshTrigger, fetchActivities]);

  // Auto-poll every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPolling(true);
      fetchActivities(true);
    }, 45_000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Clear "new" highlights after 4s
  useEffect(() => {
    if (newIds.size === 0) return;
    const t = setTimeout(() => setNewIds(new Set()), 4000);
    return () => clearTimeout(t);
  }, [newIds]);

  const filtered = activeTab === 'all'
    ? activities
    : activities.filter(a => a.type === activeTab);

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .activity-tab:hover { background: #F0FDF4 !important; color: #16A34A !important; }
        .activity-row-wrap:hover > div {
          background: #F8FAFC !important;
          border-color: #D1D5DB !important;
        }
      `}</style>

      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1.5px solid #F0F0F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              🔔
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                Recent Activities
              </h2>
              {lastFetch && (
                <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                  Updated {timeAgo(lastFetch)}
                  {polling && (
                    <span style={{ marginLeft: 6 }}>
                      <svg style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle' }}
                        width="10" height="10" viewBox="0 0 10 10">
                        <circle cx="5" cy="5" r="4" stroke="#9CA3AF" strokeWidth="1.5"
                          fill="none" strokeDasharray="16" strokeDashoffset="6"/>
                      </svg>
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchActivities()}
            title="Refresh"
            style={{
              background: '#F3F4F6', border: 'none', borderRadius: 8,
              padding: '7px 12px', cursor: 'pointer', fontSize: 13,
              color: '#374151', fontWeight: 600, transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7A6 6 0 0 1 12.5 4M13 7A6 6 0 0 1 1.5 10"
                stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 2v3h-3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 12V9h3"  stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div style={{
          display: 'flex', gap: 6, padding: '12px 20px',
          borderBottom: '1.5px solid #F0F0F0',
          overflowX: 'auto',
        }}>
          {TABS.map(tab => {
            const count = tab.key === 'all'
              ? activities.length
              : activities.filter(a => a.type === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className="activity-tab"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#DCFCE7' : '#F9FAFB',
                  color: isActive ? '#16A34A' : '#6B7280',
                  whiteSpace: 'nowrap', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span style={{
                    background: isActive ? '#16A34A' : '#E5E7EB',
                    color: isActive ? 'white' : '#6B7280',
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 10, minWidth: 18,
                    textAlign: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Activity List ── */}
        <div style={{ padding: '14px 16px', minHeight: 160 }}>
          {loading ? (
            <Skeleton />
          ) : error ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: '#EF4444', fontSize: 13,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <p style={{ margin: 0 }}>{error}</p>
              <button
                onClick={() => fetchActivities()}
                style={{
                  marginTop: 12, padding: '7px 18px',
                  background: '#FEE2E2', color: '#B91C1C',
                  border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '36px 16px', color: '#9CA3AF',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>
                {activeTab === 'all' ? '🌱' : TABS.find(t => t.key === activeTab)?.icon}
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No activities yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                {activeTab === 'all'
                  ? 'Your farm activities will appear here as they happen.'
                  : `No ${activeTab.replace('_', ' ')} activities found.`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((activity, idx) => {
                const key = activity.timestamp + activity.title;
                return (
                  <div key={`${key}-${idx}`} className="activity-row-wrap">
                    <ActivityRow
                      activity={activity}
                      isNew={newIds.has(key)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '10px 16px 14px',
            textAlign: 'center',
            borderTop: '1px solid #F0F0F0',
          }}>
            <p style={{ margin: 0, fontSize: 11.5, color: '#9CA3AF' }}>
              Showing latest {filtered.length} activities · Auto-refreshes every 45s
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default RecentActivities;