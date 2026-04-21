import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
  responded: { label: 'Responded', color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400'   },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500'  },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400'    },
  closed:    { label: 'Closed',    color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
};

const FarmerInquiries = () => {
  const [inquiries, setInquiries]               = useState([]);
  const [productTxns, setProductTxns]           = useState([]);   // ✅ product payments
  const [equipmentTxns, setEquipmentTxns]       = useState([]);   // ✅ equipment rental income
  const [loading, setLoading]                   = useState(true);
  const [activeTab, setActiveTab]               = useState('inquiries'); // 'inquiries' | 'payments'
  const [paymentSubTab, setPaymentSubTab]       = useState('all');       // 'all' | 'products' | 'equipment'
  const [selectedInquiry, setSelectedInquiry]   = useState(null);
  const [responseText, setResponseText]         = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [filterStatus, setFilterStatus]         = useState('all');
  const [page, setPage]                         = useState(1);
  const [total, setTotal]                       = useState(0);
  const [notification, setNotification]         = useState(null);

  const LIMIT = 10;

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await api.get(`/inquiries/farmer?${params}`);
      setInquiries(res.data.inquiries);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // ✅ Fetch both product and equipment transactions in parallel
      const [productRes, equipmentRes] = await Promise.allSettled([
        api.get('/payments/farmer-transactions'),
        api.get('/payments/equipment-rental-income'),
      ]);

      if (productRes.status === 'fulfilled') {
        setProductTxns(productRes.value.data.transactions || []);
      }
      if (equipmentRes.status === 'fulfilled') {
        setEquipmentTxns(equipmentRes.value.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchTransactions();
  }, [page, filterStatus]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRespond = async (inquiryId) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/inquiries/${inquiryId}/respond`, {
        farmerResponse: responseText,
        status: 'responded',
      });
      showNotification('Response sent to merchant!');
      setResponseText('');
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (err) {
      showNotification('Failed to send response. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (inquiryId, status) => {
    try {
      await api.put(`/inquiries/${inquiryId}/status`, { status });
      showNotification(`Inquiry marked as ${status}`);
      fetchInquiries();
      if (selectedInquiry?._id === inquiryId) {
        setSelectedInquiry((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      showNotification('Failed to update status.', 'error');
    }
  };

  // ── Derived totals ──
  const paidProductTxns    = productTxns.filter((t) => t.paymentStatus === 'paid');
  const paidEquipmentTxns  = equipmentTxns; // backend already filters paid only
  const totalProductRev    = paidProductTxns.reduce((s, t) => s + (t.receivedAmount || 0), 0);
  const totalEquipmentRev  = paidEquipmentTxns.reduce((s, t) => s + (t.receivedAmount || 0), 0);
  const grandTotal         = totalProductRev + totalEquipmentRev;
  const totalTxnCount      = paidProductTxns.length + paidEquipmentTxns.length;

  // ── Filtered list for the active sub-tab ──
  const visibleTxns = (() => {
    if (paymentSubTab === 'products')  return paidProductTxns.map((t) => ({ ...t, _type: 'product' }));
    if (paymentSubTab === 'equipment') return paidEquipmentTxns.map((t) => ({ ...t, _type: 'equipment' }));
    // 'all' — merge and sort by paidAt desc
    const merged = [
      ...paidProductTxns.map((t) => ({ ...t, _type: 'product' })),
      ...paidEquipmentTxns.map((t) => ({ ...t, _type: 'equipment' })),
    ];
    return merged.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  })();

  return (
    <div className="max-w-5xl mx-auto">

      {/* Floating Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in
          ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          <span>{notification.type === 'error' ? '❌' : '✅'}</span>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Inquiries & Payments</h1>
        <p className="text-gray-500 text-sm">Manage merchant inquiries and track your payment receipts</p>
      </div>

      {/* Main Tab Bar */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inquiries' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💬 Inquiries
          {inquiries.filter((i) => i.status === 'pending').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {inquiries.filter((i) => i.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'payments' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Payments Received
          {totalTxnCount > 0 && (
            <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {totalTxnCount}
            </span>
          )}
        </button>
      </div>

      {/* ────── INQUIRIES TAB ────── */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'responded', 'accepted', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                    filterStatus === s
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-500 text-sm">No inquiries found</p>
              </div>
            ) : (
              inquiries.map((inq) => (
                <button
                  key={inq._id}
                  onClick={() => setSelectedInquiry(inq)}
                  className={`w-full text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-md ${
                    selectedInquiry?._id === inq._id
                      ? 'border-green-400 shadow-md ring-2 ring-green-100'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{inq.subject}</p>
                    <span className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[inq.status]?.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[inq.status]?.dot}`} />
                      {STATUS_CONFIG[inq.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">From: {inq.merchantName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {inq.productId?.productName} · {new Date(inq.createdAt).toLocaleDateString()}
                  </p>
                  {inq.requestedQuantity && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Requested: {inq.requestedQuantity} units
                      {inq.offeredPrice ? ` @ ₹${inq.offeredPrice}` : ''}
                    </p>
                  )}
                </button>
              ))
            )}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="text-xs text-gray-500 hover:text-green-600 disabled:opacity-30"
                >← Prev</button>
                <span className="text-xs text-gray-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
                <button
                  disabled={page >= Math.ceil(total / LIMIT)}
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs text-gray-500 hover:text-green-600 disabled:opacity-30"
                >Next →</button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3">
            {!selectedInquiry ? (
              <div className="flex items-center justify-center h-full min-h-64 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-center">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-gray-400 text-sm">Select an inquiry to view details</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{selectedInquiry.subject}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${STATUS_CONFIG[selectedInquiry.status]?.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedInquiry.status]?.dot}`} />
                      {STATUS_CONFIG[selectedInquiry.status]?.label}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Product</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedInquiry.productId?.productName}</p>
                      <p className="text-xs text-gray-500">₹{selectedInquiry.productId?.price} / unit</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Merchant</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedInquiry.merchantName}</p>
                      <p className="text-xs text-gray-500">{selectedInquiry.merchantContact}</p>
                    </div>
                  </div>

                  {(selectedInquiry.requestedQuantity || selectedInquiry.offeredPrice) && (
                    <div className="flex gap-3">
                      {selectedInquiry.requestedQuantity && (
                        <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                          <p className="text-xs text-blue-400 mb-1">Requested Qty</p>
                          <p className="text-xl font-bold text-blue-700">{selectedInquiry.requestedQuantity}</p>
                          <p className="text-xs text-blue-400">units</p>
                        </div>
                      )}
                      {selectedInquiry.offeredPrice && (
                        <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                          <p className="text-xs text-green-400 mb-1">Offered Price</p>
                          <p className="text-xl font-bold text-green-700">₹{selectedInquiry.offeredPrice}</p>
                          <p className="text-xs text-green-400">per unit</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Message</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  {selectedInquiry.farmerResponse && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Your Response</p>
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 leading-relaxed">
                        {selectedInquiry.farmerResponse}
                      </div>
                      {selectedInquiry.responseDate && (
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          Responded on {new Date(selectedInquiry.responseDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedInquiry.status !== 'closed' && selectedInquiry.status !== 'rejected' && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                        {selectedInquiry.farmerResponse ? 'Update Response' : 'Send Response'}
                      </p>
                      <textarea
                        rows={3}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to the merchant..."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                      />
                      <button
                        onClick={() => handleRespond(selectedInquiry._id)}
                        disabled={submitting || !responseText.trim()}
                        className="mt-2 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        {submitting ? 'Sending...' : '📤 Send Response'}
                      </button>
                    </div>
                  )}

                  {selectedInquiry.status === 'responded' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleStatusUpdate(selectedInquiry._id, 'accepted')}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2 rounded-xl text-sm font-medium transition-colors"
                      >✅ Accept Deal</button>
                      <button
                        onClick={() => handleStatusUpdate(selectedInquiry._id, 'rejected')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-medium transition-colors"
                      >❌ Reject</button>
                    </div>
                  )}
                  {selectedInquiry.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedInquiry._id, 'closed')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium transition-colors"
                    >🔒 Close Inquiry</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── PAYMENTS TAB ────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">

          {/* ✅ Combined Summary Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <p className="text-green-100 text-sm font-medium mb-1">Total Revenue Received</p>
            <p className="text-4xl font-bold mb-4">₹{grandTotal.toFixed(2)}</p>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white bg-opacity-15 rounded-xl p-3">
                <p className="text-green-100 text-xs mb-1">📦 Product Sales</p>
                <p className="text-xl font-bold">₹{totalProductRev.toFixed(2)}</p>
                <p className="text-green-200 text-xs mt-0.5">{paidProductTxns.length} order(s)</p>
              </div>
              <div className="bg-white bg-opacity-15 rounded-xl p-3">
                <p className="text-green-100 text-xs mb-1">🚜 Equipment Rentals</p>
                <p className="text-xl font-bold">₹{totalEquipmentRev.toFixed(2)}</p>
                <p className="text-green-200 text-xs mt-0.5">{paidEquipmentTxns.length} rental(s)</p>
              </div>
            </div>
          </div>

          {/* ✅ Sub-tab filter: All / Products / Equipment */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { key: 'all',       label: `All (${totalTxnCount})`                    },
              { key: 'products',  label: `📦 Products (${paidProductTxns.length})`   },
              { key: 'equipment', label: `🚜 Equipment (${paidEquipmentTxns.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPaymentSubTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  paymentSubTab === tab.key
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ✅ Transaction list */}
          {visibleTxns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-gray-500 text-sm">No payment receipts yet</p>
              <p className="text-gray-400 text-xs mt-1">
                {paymentSubTab === 'products'  && 'Product payments from merchants will appear here'}
                {paymentSubTab === 'equipment' && 'Equipment rental payments will appear here'}
                {paymentSubTab === 'all'       && 'All payments will appear here after checkout'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTxns.map((txn, idx) => (
                <div
                  key={txn.orderId || txn.bookingId || idx}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Icon — different per type */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    txn._type === 'equipment' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {txn._type === 'equipment' ? '🚜' : '💰'}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">
                        {txn._type === 'equipment' ? txn.renterName : txn.merchantName}
                      </p>
                      {/* Type badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        txn._type === 'equipment'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        {txn._type === 'equipment' ? '🚜 Rental' : '📦 Product'}
                      </span>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200">
                        ✅ Paid
                      </span>
                    </div>

                    {/* Reference ID */}
                    <p className="text-xs text-gray-500">
                      {txn._type === 'equipment'
                        ? `Booking #${txn.bookingId || '—'} · ${txn.equipmentName}`
                        : `Order #${txn.orderId} · ${txn.itemsCount} product(s)`
                      }
                    </p>

                    {/* Extra detail for equipment */}
                    {txn._type === 'equipment' && txn.totalDays && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {txn.totalDays} day(s) × ₹{txn.pricePerDay}/day
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-green-700">₹{Number(txn.receivedAmount || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">received</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default FarmerInquiries;