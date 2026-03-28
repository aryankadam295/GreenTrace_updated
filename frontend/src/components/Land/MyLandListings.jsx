import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const MyLandListings = ({ embedded = false, onAddLand }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchMyLands();
  }, []);

  const fetchMyLands = async () => {
    try {
      const response = await api.get('/land/farmer/me');
      setListings(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your land listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLand = () => {
    if (onAddLand) {
      onAddLand();
      return;
    }
    navigate('/add-land');
  };

  if (loading) {
    return (
      <div className={embedded ? 'p-6 md:p-8' : 'min-h-screen bg-gray-50 px-4 py-8'}>
        <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">Loading your land listings...</div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6 md:p-8' : 'min-h-screen bg-gray-50 px-4 py-8'}>
      <div className={embedded ? '' : 'mx-auto max-w-6xl'}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">My Land Listings</h2>
            <p className="mt-2 text-gray-600">Track verification status, pricing, and uploaded documents in one place.</p>
          </div>
          <button
            onClick={handleAddLand}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            + Add New Land
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">No land listings yet</h3>
            <p className="mt-2 text-gray-600">Create your first listing to start receiving rental interest.</p>
            <button
              onClick={handleAddLand}
              className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              List Your Land
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {listings.map((land) => (
              <div key={land._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {land.landImage ? (
                  <img
                    src={getImageUrl(land.landImage)}
                    alt={land.title}
                    className="mb-5 h-52 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-5 flex h-52 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 text-sm font-medium text-green-800">
                    Land image not provided
                  </div>
                )}
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{land.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {land.village}, {land.district}, {land.state}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[land.status] || statusStyles.pending}`}>
                    {land.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="block text-xs uppercase tracking-wide text-gray-500">Area</span>
                    <span className="mt-1 block font-semibold text-gray-900">{land.area}</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="block text-xs uppercase tracking-wide text-gray-500">Rent</span>
                    <span className="mt-1 block font-semibold text-gray-900">
                      INR {land.rentPrice} / {land.rentDuration === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="block text-xs uppercase tracking-wide text-gray-500">Documents</span>
                    <span className="mt-1 block font-semibold text-gray-900">{land.documents?.length || 0} uploaded</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="block text-xs uppercase tracking-wide text-gray-500">Created</span>
                    <span className="mt-1 block font-semibold text-gray-900">{new Date(land.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {land.description || 'No additional description provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLandListings;
