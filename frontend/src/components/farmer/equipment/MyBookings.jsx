import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import api from '../../../utils/api';
import ReviewForm from './ReviewForm';
import { getMediaUrl } from '../../../utils/media';

// ─────────────────────────────────────────────
// UPI Payment Modal — shown when renter clicks "Pay via UPI"
// ─────────────────────────────────────────────
const UpiPaymentModal = ({ booking, onClose, onSuccess }) => {
  const [step, setStep] = useState('loading'); // loading | ready | confirming | done
  const [paymentData, setPaymentData] = useState(null);
  const [txnId, setTxnId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      const res = await api.post('/payments/initiate-equipment-payment', {
        bookingId: booking._id,
      });
      setPaymentData(res.data);
      setStep('ready');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment details.');
      setStep('ready');
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/payments/confirm-equipment-payment', {
        bookingDbId: booking._id,
        upiTransactionId: txnId,
      });
      setStep('done');
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setLoading(false);
    }
  };

  const getUpiLink = (upiId, amount, ownerName, bookingId) => {
    const note = `GreenTrace Equipment Rental ${bookingId}`;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(ownerName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Pay via UPI</h3>
            <p className="text-xs text-gray-500 mt-0.5">{booking.equipmentId?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading payment details...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Ready — show payment details */}
          {step === 'ready' && paymentData && (
            <>
              {/* Booking summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono text-gray-800">{paymentData.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{paymentData.rentalDetails.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-medium">₹{paymentData.rentalDetails.pricePerDay}/day</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-700 font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-green-700">₹{paymentData.ownerPayment.amount}</span>
                </div>
              </div>

              {/* UPI payment section */}
              {paymentData.ownerPayment.upiId ? (
                <>
                  {/* UPI ID display */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Pay to (UPI ID)</p>
                      <p className="font-mono font-bold text-green-800">{paymentData.ownerPayment.upiId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{paymentData.ownerPayment.ownerName}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(paymentData.ownerPayment.upiId)}
                      className="text-xs border border-green-300 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Open UPI App */}
                  <a
                    href={getUpiLink(
                      paymentData.ownerPayment.upiId,
                      paymentData.ownerPayment.amount,
                      paymentData.ownerPayment.ownerName,
                      paymentData.bookingId
                    )}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    📲 Open UPI App to Pay ₹{paymentData.ownerPayment.amount}
                  </a>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>after paying, enter transaction ID below</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Transaction ID input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPI Transaction ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 407912345678"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Find this in your UPI app under payment history
                    </p>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {loading ? 'Confirming...' : 'I Have Paid — Confirm Booking'}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    By confirming, you declare the UPI payment has been made to the equipment owner.
                  </p>
                </>
              ) : (
                // Owner has no UPI ID
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                  <p className="font-semibold mb-1">⚠️ Owner has not set a UPI ID</p>
                  <p>Please contact the owner directly to arrange payment.</p>
                  {paymentData.ownerPayment.ownerPhone && (
                    <p className="mt-2 font-medium">📞 {paymentData.ownerPayment.ownerPhone}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <p className="text-5xl mb-3">✅</p>
              <p className="font-bold text-green-800 text-lg">Payment Confirmed!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your equipment rental is now active. Happy farming! 🚜
              </p>
              <button
                onClick={onClose}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Payment Status Badge
// ─────────────────────────────────────────────
const PaymentBadge = ({ paymentStatus }) => {
  if (!paymentStatus || paymentStatus === 'pending') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">
        💳 Payment Pending
      </span>
    );
  }
  if (paymentStatus === 'paid') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
        ✅ Paid
      </span>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// Main MyBookings Component
// ─────────────────────────────────────────────
const MyBookings = ({ onRefresh }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [payingBooking, setPayingBooking] = useState(null); // ✅ NEW

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
          onSuccess={() => { setReviewingBooking(null); fetchMyBookings(); }}
          onCancel={() => setReviewingBooking(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">

      {/* ✅ UPI Payment Modal */}
      {payingBooking && (
        <UpiPaymentModal
          booking={payingBooking}
          onClose={() => setPayingBooking(null)}
          onSuccess={() => {
            setPayingBooking(null);
            fetchMyBookings();
            if (onRefresh) onRefresh();
          }}
        />
      )}

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
                      {/* ✅ Payment badge */}
                      <PaymentBadge paymentStatus={booking.paymentStatus} />
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

                  {/* Owner Info */}
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="mr-1">👤</span>
                    Owner: {booking.ownerId?.fullName}
                    {booking.ownerId?.phoneNumber && ` • 📞 ${booking.ownerId.phoneNumber}`}
                  </div>

                  {/* Owner Response */}
                  {booking.ownerResponse && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium">Owner's Response: </span>
                      <span className="text-gray-600">{booking.ownerResponse}</span>
                    </div>
                  )}

                  {/* ✅ UPI Transaction ID (if paid) */}
                  {booking.paymentStatus === 'paid' && booking.upiTransactionId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                      ✅ UPI Txn ID: <span className="font-mono font-medium">{booking.upiTransactionId}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">

                    {/* Cancel if still requested */}
                    {booking.status === 'requested' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* ✅ PAY button — shown when approved and not yet paid */}
                    {booking.status === 'approved' && booking.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => setPayingBooking(booking)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        💳 Pay ₹{booking.totalPrice} via UPI
                      </button>
                    )}

                    {/* Review */}
                    {booking.status === 'completed' && !booking.hasReview && (
                      <button
                        onClick={() => setReviewingBooking(booking)}
                        className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                      >
                        ⭐ Leave Review
                      </button>
                    )}

                    {booking.status === 'completed' && booking.hasReview && (
                      <span className="px-3 py-1.5 text-sm text-gray-500 italic">✓ Review submitted</span>
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

export default MyBookings;