import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import ReviewForm from './ReviewForm';
import { getMediaUrl } from '../../../utils/media';

const MyBookings = ({ onRefresh }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingBooking, setReviewingBooking] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMyBookings();
  }, [page, statusFilter]);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await equipmentAPI.getMyBookings(params);
      setBookings(response.data.bookings);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return;
    
    try {
      await equipmentAPI.updateBookingStatus(bookingId, { status: 'cancelled' });
      fetchMyBookings();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in-use': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested': return '⏳';
      case 'approved': return '✅';
      case 'in-use': return '🚜';
      case 'completed': return '✔️';
      case 'cancelled': return '❌';
      case 'rejected': return '🚫';
      default: return '📋';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show review form
  if (reviewingBooking) {
    return (
      <div className="p-4">
        <button
          onClick={() => setReviewingBooking(null)}
          className="mb-4 text-green-600 hover:underline flex items-center"
        >
          ← Back to My Bookings
        </button>
        <ReviewForm
          booking={reviewingBooking}
          onSuccess={() => {
            setReviewingBooking(null);
            fetchMyBookings();
          }}
          onCancel={() => setReviewingBooking(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Rentals</h2>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="in-use">In Use</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
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
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
          <p className="text-gray-500">Browse available equipment and make a booking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Equipment Image */}
                <div className="w-full md:w-32 h-32 flex-shrink-0">
                  <img
                    src={booking.equipmentId?.images?.[0]
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
                    <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status}
                    </span>
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

                  {/* Owner Info */}
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="mr-1">👤</span>
                    Owner: {booking.ownerId?.fullName}
                    {booking.ownerId?.phoneNumber && ` • 📞 ${booking.ownerId.phoneNumber}`}
                  </div>

                  {/* Owner Response */}
                  {booking.ownerResponse && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium">Owner's Response:</span>
                      <p className="text-gray-600">{booking.ownerResponse}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.status === 'requested' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Cancel Request
                      </button>
                    )}

                    {booking.status === 'completed' && !booking.hasReview && (
                      <button
                        onClick={() => setReviewingBooking(booking)}
                        className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                      >
                        ⭐ Leave Review
                      </button>
                    )}

                    {booking.status === 'completed' && booking.hasReview && (
                      <span className="px-3 py-1.5 text-sm text-gray-500 italic">
                        ✓ Review submitted
                      </span>
                    )}

                    {booking.equipmentId?.location && (
                      <span className="px-3 py-1.5 text-sm text-gray-500">
                        📍 {booking.equipmentId.location.village}, {booking.equipmentId.location.district}
                      </span>
                    )}
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
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
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

export default MyBookings;
