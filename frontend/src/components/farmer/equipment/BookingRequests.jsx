import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import api from '../../../utils/api';
import { getMediaUrl } from '../../../utils/media';

// ─────────────────────────────────────────────
// Payment Status Badge
// ─────────────────────────────────────────────
const PaymentBadge = ({ paymentStatus }) => {
  if (paymentStatus === 'paid') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
        ✅ Paid
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">
      💳 Awaiting Payment
    </span>
  );
};

// ─────────────────────────────────────────────
// Rental Income Summary Card
// ─────────────────────────────────────────────
const RentalIncomeSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/equipment-rental-income')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data || data.transactions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white mb-6">
      <p className="text-green-100 text-sm font-medium mb-1">Total Rental Income Received</p>
      <p className="text-3xl font-bold mb-3">₹{Number(data.totalIncome).toFixed(2)}</p>
      <div className="flex gap-4 text-sm text-green-100">
        <span>🚜 {data.transactions.length} paid rental(s)</span>
      </div>

      {/* Recent transactions */}
      <div className="mt-4 space-y-2">
        {data.transactions.slice(0, 3).map((txn, i) => (
          <div key={i} className="flex justify-between items-center bg-white bg-opacity-10 rounded-lg px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{txn.equipmentName}</p>
              <p className="text-green-100 text-xs">{txn.renterName} • {txn.totalDays} days</p>
            </div>
            <p className="font-bold">₹{txn.receivedAmount}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main BookingRequests Component
// ─────────────────────────────────────────────
const BookingRequests = ({ onRefresh }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookingRequests();
  }, [page, statusFilter]);

  const fetchBookingRequests = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await equipmentAPI.getBookingRequests(params);
      setBookings(res.data.bookings);
      setTotalPages(res.data.totalPages);
      setStatusCounts(res.data.statusCounts || {});
    } catch {
      setError('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    setActionLoading(bookingId);
    try {
      await equipmentAPI.updateBookingStatus(bookingId, {
        status,
        response: respondingTo === bookingId ? response : undefined,
      });
      setRespondingTo(null);
      setResponse('');
      fetchBookingRequests();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${status} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'approved':  return 'bg-blue-100 text-blue-800';
      case 'in-use':    return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected':  return 'bg-red-100 text-red-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested': return '⏳';
      case 'approved':  return '✅';
      case 'in-use':    return '🚜';
      case 'completed': return '✔️';
      case 'cancelled': return '❌';
      case 'rejected':  return '🚫';
      default:          return '📋';
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 md:p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Booking Requests</h2>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="requested">Requested ({statusCounts.requested || 0})</option>
            <option value="approved">Approved ({statusCounts.approved || 0})</option>
            <option value="in-use">In Use ({statusCounts['in-use'] || 0})</option>
            <option value="completed">Completed ({statusCounts.completed || 0})</option>
            <option value="cancelled">Cancelled ({statusCounts.cancelled || 0})</option>
            <option value="rejected">Rejected ({statusCounts.rejected || 0})</option>
          </select>
        </div>
      </div>

      {/* ✅ Rental Income Summary — only visible to owner */}
      <RentalIncomeSummary />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {[
          { status: 'requested', label: 'Pending',   color: 'bg-yellow-50 border-yellow-200' },
          { status: 'approved',  label: 'Approved',  color: 'bg-blue-50 border-blue-200'    },
          { status: 'in-use',    label: 'In Use',    color: 'bg-green-50 border-green-200'  },
          { status: 'completed', label: 'Completed', color: 'bg-gray-50 border-gray-200'    },
          { status: 'cancelled', label: 'Cancelled', color: 'bg-red-50 border-red-200'      },
          { status: 'rejected',  label: 'Rejected',  color: 'bg-red-50 border-red-200'      },
        ].map(({ status, label, color }) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`p-2 rounded-lg border text-center transition-all ${color} ${
              statusFilter === status ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <p className="text-lg font-bold">{statusCounts[status] || 0}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <span className="text-6xl mb-4 block">📥</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No booking requests</h3>
          <p className="text-gray-500">When someone requests to rent your equipment, it will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4">

                {/* Equipment Image */}
                <div className="w-full md:w-32 h-32 flex-shrink-0">
                  <img
                    src={
                      booking.equipmentId?.images?.[0]
                        ? getMediaUrl(booking.equipmentId.images[0], 'equipment')
                        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40">🚜</text></svg>'
                    }
                    alt={booking.equipmentId?.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.equipmentId?.name || 'Equipment'}</h3>
                      <p className="text-sm text-gray-500">{booking.equipmentId?.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)} {booking.status}
                      </span>
                      {/* ✅ Payment badge on owner's side */}
                      {(booking.status === 'approved' || booking.status === 'in-use' || booking.status === 'completed') && (
                        <PaymentBadge paymentStatus={booking.paymentStatus} />
                      )}
                    </div>
                  </div>

                  {/* Renter Info */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      👤 {booking.renterId?.fullName}
                    </p>
                    <div className="text-sm text-blue-700 mt-1">
                      {booking.renterId?.phoneNumber && <span>📞 {booking.renterId.phoneNumber}</span>}
                      {booking.renterId?.village && (
                        <span className="ml-3">📍 {booking.renterId.village}, {booking.renterId.district}</span>
                      )}
                    </div>
                  </div>

                  {/* Dates and Price */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">From:</span>
                      <p className="font-medium">{formatDate(booking.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">To:</span>
                      <p className="font-medium">{formatDate(booking.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <p className="font-medium">{booking.totalDays} days</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium text-green-600">₹{booking.totalPrice}</p>
                    </div>
                  </div>

                  {/* Renter's Message */}
                  {booking.renterMessage && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium">Renter's Message: </span>
                      <span className="text-gray-600">{booking.renterMessage}</span>
                    </div>
                  )}

                  {/* ✅ UPI Transaction ID — visible to owner once paid */}
                  {booking.paymentStatus === 'paid' && booking.upiTransactionId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                      ✅ UPI Txn ID: <span className="font-mono font-medium">{booking.upiTransactionId}</span>
                      {booking.paidAt && (
                        <span className="ml-3 text-green-500">
                          · Paid on {new Date(booking.paidAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ✅ Awaiting payment notice for owner */}
                  {booking.status === 'approved' && booking.paymentStatus !== 'paid' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      ⏳ Waiting for renter to complete UPI payment of ₹{booking.totalPrice}
                    </div>
                  )}

                  {/* Response Form */}
                  {booking.status === 'requested' && respondingTo === booking._id && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Response (Optional)
                      </label>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows="2"
                        placeholder="Add a message for the renter..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.status === 'requested' && (
                      <>
                        {respondingTo !== booking._id ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'approved')}
                              disabled={actionLoading === booking._id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✅ Approve'}
                            </button>
                            <button
                              onClick={() => setRespondingTo(booking._id)}
                              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                            >
                              ✏️ Respond
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                              disabled={actionLoading === booking._id}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-400"
                            >
                              🚫 Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'approved')}
                              disabled={actionLoading === booking._id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✅ Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                              disabled={actionLoading === booking._id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                            >
                              🚫 Reject
                            </button>
                            <button
                              onClick={() => { setRespondingTo(null); setResponse(''); }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* Mark In Use — only after payment */}
                    {booking.status === 'approved' && booking.paymentStatus === 'paid' && (
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'in-use')}
                        disabled={actionLoading === booking._id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {actionLoading === booking._id ? 'Processing...' : '🚜 Mark In Use'}
                      </button>
                    )}

                    {booking.status === 'in-use' && (
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                        disabled={actionLoading === booking._id}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                      >
                        {actionLoading === booking._id ? 'Processing...' : '✔️ Mark Completed'}
                      </button>
                    )}

                    <span className="px-3 py-2 text-sm text-gray-500">
                      Requested: {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingRequests;