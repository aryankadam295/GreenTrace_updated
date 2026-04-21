import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
  responded: { label: 'Responded', color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400'   },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500'  },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400'    },
  closed:    { label: 'Closed',    color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
};

// ─────────────────────────────────────────────
// Create Inquiry Modal — Farmer first, then product
// ─────────────────────────────────────────────
const CreateInquiryModal = ({ onClose, onSuccess }) => {
  // Step 1: pick farmer | Step 2: fill inquiry details
  const [step, setStep] = useState(1);

  // Farmer search state
  const [farmerSearch, setFarmerSearch]     = useState('');
  const [farmers, setFarmers]               = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Products for selected farmer
  const [products, setProducts]             = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [form, setForm] = useState({
    productId: '',
    subject: '',
    message: '',
    requestedQuantity: '',
    offeredPrice: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  // ── Search farmers as user types ──────────────────────────────────────
  useEffect(() => {
    const query = farmerSearch.trim();
    if (query.length < 1) { setFarmers([]); return; }

    setLoadingFarmers(true);
    const timer = setTimeout(async () => {
      try {
        // Reuse the public products endpoint — extract unique farmers from results
        // Or better: hit /users if you have a public farmer listing endpoint.
        // We'll use products and deduplicate by farmerId.
       const res = await api.get(`/users/farmers/search?query=${encodeURIComponent(query)}`);
        const prods = res.data.products || res.data || [];

        // Deduplicate farmers from products
      const farmersData = res.data.farmers || [];

setFarmers(
  farmersData.map(f => ({
    _id: f._id,
    fullName: f.fullName,
    location: [f.district, f.state].filter(Boolean).join(', ')
  }))
);
      } catch {
        setFarmers([]);
      } finally {
        setLoadingFarmers(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [farmerSearch]);

  // ── Load farmer's products when farmer is selected ───────────────────
  useEffect(() => {
    if (!selectedFarmer) return;
    setLoadingProducts(true);
    setForm(f => ({ ...f, productId: '' }));
    api.get(`/products?status=listed&farmerId=${selectedFarmer._id}&limit=50`)
      .then(res => setProducts(res.data.products || res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [selectedFarmer]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerSearch(farmer.fullName);
    setFarmers([]);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedFarmer(null);
    setFarmerSearch('');
    setFarmers([]);
    setForm({ productId: '', subject: '', message: '', requestedQuantity: '', offeredPrice: '' });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.productId || !form.subject || !form.message) {
      setError('Please select a product, and fill subject and message.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/inquiries', {
        productId: form.productId,
        subject: form.subject,
        message: form.message,
        requestedQuantity: form.requestedQuantity ? Number(form.requestedQuantity) : undefined,
        offeredPrice: form.offeredPrice ? Number(form.offeredPrice) : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p._id === form.productId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ←
              </button>
            )}
            <div>
              <h3 className="font-bold text-gray-900 text-lg">New Inquiry</h3>
              {/* Step indicator */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-xs font-medium ${step === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  1. Select Farmer
                </span>
                <span className="text-gray-300 text-xs">›</span>
                <span className={`text-xs font-medium ${step === 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  2. Write Inquiry
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >×</button>
        </div>

        <div className="p-5">

          {/* ════════════════════════════════════════
              STEP 1 — Select Farmer
          ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Search for a farmer by name or product keyword to begin your inquiry.
              </p>

              {/* Search input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  🔍
                </div>
                <input
                  type="text"
                  value={farmerSearch}
                  onChange={e => setFarmerSearch(e.target.value)}
                  placeholder="Search by farmer name or product..."
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                />
                {loadingFarmers && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Farmer results */}
              {farmers.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {farmers.map((farmer, i) => (
                    <button
                      key={farmer._id}
                      onClick={() => handleSelectFarmer(farmer)}
                      className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center justify-between gap-3 ${
                        i !== 0 ? 'border-t border-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                          🌾
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{farmer.fullName}</p>
                          {farmer.location && (
                            <p className="text-xs text-gray-500">📍 {farmer.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                          {farmer.productCount} product{farmer.productCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {farmerSearch.length >= 1 && !loadingFarmers && farmers.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-gray-500 text-sm font-medium">No farmers found</p>
                  <p className="text-gray-400 text-xs mt-1">Try a different name or product keyword</p>
                </div>
              )}

              {/* Prompt when empty */}
              {farmerSearch.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-3xl mb-2">🌾</p>
                  <p className="text-gray-500 text-sm">Start typing to search for farmers</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — Fill Inquiry Details
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Selected farmer banner */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                  🌾
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">{selectedFarmer?.fullName}</p>
                  {selectedFarmer?.location && (
                    <p className="text-xs text-green-600">📍 {selectedFarmer.location}</p>
                  )}
                </div>
                <button
                  onClick={handleBack}
                  className="text-xs text-green-600 hover:text-green-800 font-medium underline flex-shrink-0"
                >
                  Change
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <span>⚠️</span>{error}
                </div>
              )}

              {/* Product selector — only this farmer's products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product *
                </label>
                {loadingProducts ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ) : products.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                    ⚠️ This farmer has no listed products at the moment.
                  </div>
                ) : (
                  <select
                    name="productId"
                    value={form.productId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    <option value="">Choose a product...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.productName} — ₹{p.price}/{p.unit} · {p.quantity} {p.unit} available
                      </option>
                    ))}
                  </select>
                )}

                {/* Product details preview */}
                {selectedProduct && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Price',     value: `₹${selectedProduct.price}/${selectedProduct.unit}` },
                      { label: 'Available', value: `${selectedProduct.quantity} ${selectedProduct.unit}` },
                      { label: 'Quality',   value: selectedProduct.qualityGrade || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Bulk order inquiry for tomatoes"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              {/* Quantity + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Qty
                    {selectedProduct && <span className="text-gray-400 font-normal"> ({selectedProduct.unit})</span>}
                  </label>
                  <input
                    type="number"
                    name="requestedQuantity"
                    value={form.requestedQuantity}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    min="0"
                    max={selectedProduct?.quantity}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  {selectedProduct && (
                    <p className="text-xs text-gray-400 mt-1">Max: {selectedProduct.quantity} {selectedProduct.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offered Price (₹)
                    {selectedProduct && <span className="text-gray-400 font-normal"> / {selectedProduct.unit}</span>}
                  </label>
                  <input
                    type="number"
                    name="offeredPrice"
                    value={form.offeredPrice}
                    onChange={handleChange}
                    placeholder={selectedProduct ? `Listed: ₹${selectedProduct.price}` : 'e.g. 20'}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  {selectedProduct && form.offeredPrice && (
                    <p className={`text-xs mt-1 font-medium ${
                      Number(form.offeredPrice) >= selectedProduct.price
                        ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {Number(form.offeredPrice) >= selectedProduct.price
                        ? '✓ At or above listed price'
                        : `↓ ₹${(selectedProduct.price - Number(form.offeredPrice)).toFixed(2)} below listed price`}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your requirements, delivery preferences, or any questions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                />
              </div>

              {/* Summary before sending */}
              {selectedProduct && form.requestedQuantity && form.offeredPrice && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📋 Inquiry Summary</p>
                  <p className="text-xs text-blue-600">
                    Requesting <strong>{form.requestedQuantity} {selectedProduct.unit}</strong> of{' '}
                    <strong>{selectedProduct.productName}</strong> at{' '}
                    <strong>₹{form.offeredPrice}/{selectedProduct.unit}</strong>
                    {' '}= <strong>₹{(Number(form.requestedQuantity) * Number(form.offeredPrice)).toLocaleString()} total</strong>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || products.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Sending...' : '📤 Send Inquiry'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main MerchantInquiries Component (unchanged)
// ─────────────────────────────────────────────
const MerchantInquiries = () => {
  const [inquiries, setInquiries]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus]       = useState('all');
  const [page, setPage]                       = useState(1);
  const [total, setTotal]                     = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification]       = useState(null);

  const LIMIT = 10;

 const fetchInquiries = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filterStatus !== 'all') params.append('status', filterStatus);

    const res = await api.get(`/inquiries/merchant?${params}`);

    const data = res.data.inquiries || [];

    setInquiries(data);
    setTotal(res.data.total || 0);

    // ✅ IMPORTANT FIX: update selected inquiry also
    if (selectedInquiry) {
      const updated = data.find(i => i._id === selectedInquiry._id);
      if (updated) {
        setSelectedInquiry(updated);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchInquiries(); }, [page, filterStatus]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusUpdate = async (inquiryId, status) => {
    try {
      await api.put(`/inquiries/${inquiryId}/status`, { status });
      showNotification(`Inquiry marked as ${status}`);
      fetchInquiries();
      if (selectedInquiry?._id === inquiryId)
        setSelectedInquiry(prev => ({ ...prev, status }));
    } catch {
      showNotification('Failed to update status.', 'error');
    }
  };

  const counts = inquiries.reduce((acc, inq) => {
    acc[inq.status] = (acc[inq.status] || 0) + 1;
    return acc;
  }, {});
  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Notification toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2
          ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <span>{notification.type === 'error' ? '❌' : '✅'}</span>
          {notification.msg}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateInquiryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            showNotification('Inquiry sent to farmer!');
            fetchInquiries();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Inquiries</h1>
          <p className="text-gray-500 text-sm">Send inquiries to farmers and track their responses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          ✉️ New Inquiry
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'responded', 'accepted', 'rejected', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              filterStatus === s
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
            }`}
          >
            {s === 'all' ? `All (${total})` : `${STATUS_CONFIG[s]?.label} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Pending notice */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-800">
          <span>⏳</span>
          <span>{pendingCount} inquiry{pendingCount > 1 ? 's are' : ' is'} awaiting farmer response.</span>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Inquiry list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            [1, 2, 3].map(n => <div key={n} className="bg-gray-100 rounded-xl h-28 animate-pulse" />)
          ) : inquiries.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm font-medium">No inquiries found</p>
              <p className="text-gray-400 text-xs mt-1">
                {filterStatus === 'all' ? 'Click "New Inquiry" to contact a farmer' : `No ${filterStatus} inquiries`}
              </p>
              {filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  ✉️ Send First Inquiry
                </button>
              )}
            </div>
          ) : (
            inquiries.map(inq => (
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
                <p className="text-xs text-gray-500">To: {inq.farmerName || inq.productId?.farmerName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {inq.productId?.productName} · {new Date(inq.createdAt).toLocaleDateString()}
                </p>
                {inq.requestedQuantity && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Qty: {inq.requestedQuantity} units{inq.offeredPrice ? ` @ ₹${inq.offeredPrice}` : ''}
                  </p>
                )}
                {inq.status === 'responded' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    Farmer replied — review response
                  </div>
                )}
              </button>
            ))
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-xs text-gray-500 hover:text-green-600 disabled:opacity-30">← Prev</button>
              <span className="text-xs text-gray-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="text-xs text-gray-500 hover:text-green-600 disabled:opacity-30">Next →</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
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
                    <p className="text-xs text-gray-500 mt-0.5">Sent {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
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
                    <p className="font-semibold text-gray-800 text-sm">{selectedInquiry.productId?.productName || '—'}</p>
                    <p className="text-xs text-gray-500">₹{selectedInquiry.productId?.price} / {selectedInquiry.productId?.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Farmer</p>
                    <p className="font-semibold text-gray-800 text-sm">{selectedInquiry.farmerName || selectedInquiry.productId?.farmerName || '—'}</p>
                    {selectedInquiry.farmerContact && <p className="text-xs text-gray-500">{selectedInquiry.farmerContact}</p>}
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
                        <p className="text-xs text-green-400 mb-1">Your Offered Price</p>
                        <p className="text-xl font-bold text-green-700">₹{selectedInquiry.offeredPrice}</p>
                        <p className="text-xs text-green-400">per unit</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Your Message</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">{selectedInquiry.message}</div>
                </div>

                {selectedInquiry.farmerResponse ? (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Farmer's Response</p>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 leading-relaxed">{selectedInquiry.farmerResponse}</div>
                    {selectedInquiry.responseDate && (
                      <p className="text-xs text-gray-400 mt-1 text-right">Responded on {new Date(selectedInquiry.responseDate).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-700 text-center">
                    ⏳ Waiting for farmer to respond...
                  </div>
                )}

                {selectedInquiry.status === 'responded' && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Your Decision</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(selectedInquiry._id, 'accepted')} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2.5 rounded-xl text-sm font-medium transition-colors">✅ Accept Deal</button>
                      <button onClick={() => handleStatusUpdate(selectedInquiry._id, 'rejected')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-medium transition-colors">❌ Reject</button>
                    </div>
                  </div>
                )}

                {selectedInquiry.status === 'accepted' && (
                  <button onClick={() => handleStatusUpdate(selectedInquiry._id, 'closed')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium transition-colors">🔒 Close Inquiry</button>
                )}

                {(selectedInquiry.status === 'closed' || selectedInquiry.status === 'rejected') && (
                  <div className="text-center py-2 text-sm text-gray-400">This inquiry has been {selectedInquiry.status}.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MerchantInquiries;