import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const LandFeed = ({ embedded = false }) => {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedIds, setReportedIds] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const apiBaseUrl = api.defaults.baseURL || '';
    const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${backendOrigin}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  useEffect(() => {
    fetchVerifiedLands();
  }, []);

  const fetchVerifiedLands = async () => {
    try {
      const response = await api.get('/land');
      setLands(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch land listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (landId) => {
    try {
      await api.post(`/land/${landId}/report`, { reason: reportReason });
      setLands((prev) =>
        prev.map((land) =>
          land._id === landId
            ? { ...land, reportCount: (land.reportCount || 0) + 1 }
            : land
        )
      );
      setReportedIds((prev) => [...new Set([...prev, landId])]);
      setReportingId(null);
      setReportReason('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to report listing. Make sure you are logged in.');
    }
  };

  if (loading) {
    return (
      <div className={embedded ? 'p-6 md:p-8' : 'min-h-screen bg-gray-50 px-4 py-8'}>
        <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">Loading land listings...</div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6 md:p-8' : 'min-h-screen bg-gray-50 px-4 py-8'}>
      <div className={embedded ? '' : 'mx-auto max-w-6xl'}>
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse Verified Land Rentals</h2>
          <p className="mt-2 text-gray-600">Explore land listings from verified farmers with clear ownership records.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {lands.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-600 shadow-sm">
            No verified land listings are available right now.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {lands.map((land) => (
              <div key={land._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {land.landImage ? (
                  <img
                    src={getImageUrl(land.landImage)}
                    alt={land.title}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-gradient-to-br from-green-100 to-emerald-50 text-sm font-medium text-green-800">
                    Land image not provided
                  </div>
                )}
                <div className="flex items-center justify-between bg-gradient-to-r from-green-700 to-emerald-600 px-5 py-3 text-white">
                  <span className="text-sm font-semibold">Verified Land Owner</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{land.area}</span>
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{land.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {land.village}, {land.district}, {land.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs uppercase tracking-wide text-gray-500">Rent</span>
                      <span className="text-lg font-bold text-green-700">
                        INR {land.rentPrice} / {land.rentDuration === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {land.description || 'No additional description provided by the farmer.'}
                  </p>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 text-lg font-bold text-white">
                        {land.owner?.fullName?.charAt(0) || 'O'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{land.owner?.fullName || 'Unknown owner'}</p>
                        <p className="text-sm text-gray-600">{land.owner?.phoneNumber || 'Contact unavailable'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <button
                    onClick={() => setReportingId(reportingId === land._id ? null : land._id)}
                    disabled={reportedIds.includes(land._id)}
                    className={`text-sm font-semibold transition ${
                      reportedIds.includes(land._id)
                        ? 'cursor-not-allowed text-gray-400'
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    {reportedIds.includes(land._id) ? 'Reported for Review' : 'Report Listing'}
                  </button>
                </div>

                {reportingId === land._id && (
                  <div className="border-t border-red-100 bg-red-50 px-6 py-5">
                    <h4 className="text-sm font-semibold text-red-700">Report suspicious listing</h4>
                    <textarea
                      placeholder="Why are you reporting this listing?"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      rows="3"
                      className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                    />
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleReport(land._id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Submit Report
                      </button>
                      <button
                        onClick={() => setReportingId(null)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandFeed;
