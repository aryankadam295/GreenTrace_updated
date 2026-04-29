import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UpiSettings = () => {
  const [upiId, setUpiId] = useState('');
  const [savedUpiId, setSavedUpiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { text, type }

  useEffect(() => {
    fetchUpiId();
  }, []);

  const fetchUpiId = async () => {
    try {
      const res = await api.get('/users/my-upi');
      setSavedUpiId(res.data.upiId);
      setUpiId(res.data.upiId || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/users/update-upi', { upiId });
      setSavedUpiId(res.data.upiId);
      setMessage({ text: 'UPI ID saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save UPI ID.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/update-upi', { upiId: '' });
      setSavedUpiId(null);
      setUpiId('');
      setMessage({ text: 'UPI ID removed.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to remove UPI ID.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const popularUpiApps = [
    { name: 'GPay', suffix: '@okicici', icon: '🟡' },
    { name: 'PhonePe', suffix: '@ybl', icon: '🟣' },
    { name: 'Paytm', suffix: '@paytm', icon: '🔵' },
    { name: 'BHIM', suffix: '@upi', icon: '🟠' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UPI Payment Settings</h1>
        <p className="text-gray-600">
          Add your UPI ID so merchants can pay you directly when they place orders.
        </p>
      </div>

      {/* Current Status Card */}
      <div className={`rounded-xl p-4 mb-6 border ${
        savedUpiId
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{savedUpiId ? '✅' : '⚠️'}</span>
          <div>
            <p className={`font-semibold text-sm ${savedUpiId ? 'text-green-800' : 'text-yellow-800'}`}>
              {savedUpiId ? 'UPI ID is active' : 'No UPI ID set'}
            </p>
            <p className={`text-xs mt-0.5 ${savedUpiId ? 'text-green-600' : 'text-yellow-600'}`}>
              {savedUpiId
                ? `Merchants will pay to: ${savedUpiId}`
                : 'Merchants cannot pay you until you add a UPI ID'}
            </p>
          </div>
        </div>
      </div>

      {/* UPI Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your UPI ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📱</span>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.trim())}
                placeholder="e.g. yourname@okicici"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Format: username@bankname — Find it in your UPI app under Profile
          </p>
        </div>

        {/* Popular UPI formats */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Common UPI ID formats:</p>
          <div className="grid grid-cols-2 gap-2">
            {popularUpiApps.map((app) => (
              <div
                key={app.name}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600"
              >
                <span>{app.icon}</span>
                <span>{app.name}: <span className="font-mono text-gray-800">name{app.suffix}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !upiId || upiId === savedUpiId}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save UPI ID'}
          </button>

          {savedUpiId && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="font-semibold text-blue-800 text-sm mb-3">How UPI payments work</h3>
        <div className="space-y-2">
          {[
            'Merchant places an order and proceeds to checkout',
            'Your UPI ID is shown to the merchant',
            'Merchant pays directly to your UPI ID via any UPI app',
            'Merchant confirms payment — your order is marked as paid',
            'Amount appears in your bank instantly'
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-blue-700">
              <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpiSettings;
