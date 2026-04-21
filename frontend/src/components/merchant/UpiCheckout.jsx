import React, { useState } from 'react';
import api from '../../utils/api';

const UpiCheckout = ({ cartTotal, onPaymentSuccess, onPaymentError, disabled }) => {
  const [step, setStep] = useState('idle'); // idle | showing_upi | done
  const [orderData, setOrderData] = useState(null);
  const [txnIds, setTxnIds] = useState({}); // { farmerId: "UPI_TXN_ID" }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/payments/initiate-upi-payment');
      setOrderData(res.data);
      setStep('showing_upi');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment.');
      onPaymentError && onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const upiTransactionIds = Object.entries(txnIds).map(([farmerId, upiTransactionId]) => ({
        farmerId,
        upiTransactionId,
      }));

      const res = await api.post('/payments/confirm-upi-payment', {
        orderDbId: orderData.orderDbId,
        upiTransactionIds,
      });

      setStep('done');
      onPaymentSuccess && onPaymentSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
      onPaymentError && onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate UPI deep link — opens GPay / PhonePe / any UPI app
  const getUpiLink = (upiId, amount, farmerName, orderId) => {
    const note = `GreenTrace Order ${orderId}`;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(farmerName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  if (disabled) {
    return (
      <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        Add items to your cart to enable payment
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">

      {/* Amount Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 font-medium">Order Total</span>
          <span className="text-2xl font-bold text-green-700">₹{cartTotal?.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400">Direct UPI payment to farmer</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── STEP: idle ── */}
      {step === 'idle' && (
        <>
          <button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Pay via UPI'
            )}
          </button>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>🔒</span><span>Secure</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>⚡</span><span>Instant UPI</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>🌾</span><span>Direct to Farmer</span>
            </div>
          </div>
        </>
      )}

      {/* ── STEP: showing UPI IDs ── */}
      {step === 'showing_upi' && orderData && (
        <div className="space-y-4">

          {/* Order info header */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-blue-800 mb-1">Order #{orderData.orderId}</p>
            <p className="text-xs text-blue-600">
              Pay each farmer separately using their UPI ID below, then enter the transaction ID to confirm.
            </p>
          </div>

          {/* One card per farmer */}
          {orderData.farmerPayments.map((fp) => (
            <div key={fp.farmerId} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">

              {/* Farmer name + amount */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{fp.farmerName}</p>
                  <p className="text-xs text-gray-500">{fp.items.length} product(s)</p>
                </div>
                <p className="text-lg font-bold text-green-700">₹{fp.amount.toFixed(2)}</p>
              </div>

              {/* Items breakdown */}
              <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                {fp.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>{item.productName} × {item.quantity}</span>
                    <span>₹{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* UPI ID section */}
              {fp.upiId ? (
                <>
                  {/* UPI ID display + copy */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <span className="text-green-600 text-lg">📱</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">UPI ID</p>
                      <p className="font-mono font-semibold text-green-800 text-sm">{fp.upiId}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(fp.upiId)}
                      className="text-xs text-green-600 hover:text-green-800 border border-green-300 px-2 py-1 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>

                  {/* ✅ FIXED: was missing opening <a> tag */}
                  <a
                    href={getUpiLink(fp.upiId, fp.amount, fp.farmerName, orderData.orderId)}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    📲 Open UPI App to Pay ₹{fp.amount.toFixed(2)}
                  </a>

                  {/* Transaction ID input */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Enter UPI Transaction ID after payment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 407912345678"
                      value={txnIds[fp.farmerId] || ''}
                      onChange={(e) =>
                        setTxnIds((prev) => ({ ...prev, [fp.farmerId]: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                </>
              ) : (
                /* Farmer has no UPI ID set */
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  ⚠️ This farmer has not added a UPI ID yet. Please contact them directly.
                </div>
              )}
            </div>
          ))}

          {/* Confirm payment button */}
          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Confirming...' : 'I Have Paid — Confirm Order'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By confirming, you declare that UPI payments have been made to the farmers above.
          </p>
        </div>
      )}

      {/* ── STEP: done ── */}
      {step === 'done' && (
        <div className="text-center py-6 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-semibold text-green-800">Order Confirmed!</p>
          <p className="text-sm text-green-600 mt-1">Your order has been placed successfully.</p>
        </div>
      )}

    </div>
  );
};

export default UpiCheckout;