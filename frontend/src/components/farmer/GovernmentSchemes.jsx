import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { farmerAPI } from '../../utils/api';

const categories = [
  'All',
  'Income Support',
  'Credit',
  'Insurance',
  'Market Access',
  'Equipment',
  'Soil & Input Support',
  'State Support',
];

const GovernmentSchemes = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [source, setSource] = useState(null);
  const [filters, setFilters] = useState({
    query: '',
    category: 'All',
    state: user?.state || '',
    district: user?.district || '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchemes = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const response = await farmerAPI.getGovernmentSchemes({
        q: nextFilters.query,
        category: nextFilters.category === 'All' ? '' : nextFilters.category,
        state: nextFilters.state,
        district: nextFilters.district,
      });

      setSchemes(response.data.schemes || []);
      setSource(response.data.source || null);
    } catch (fetchError) {
      console.error('Error fetching government schemes:', fetchError);
      setError(fetchError.response?.data?.message || 'Unable to load government schemes right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = {
      query: '',
      category: 'All',
      state: user?.state || '',
      district: user?.district || '',
    };

    setFilters(initialFilters);
    fetchSchemes(initialFilters);
  }, [user?.state, user?.district]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchSchemes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Government Schemes</h1>
          <p className="text-gray-600">
            Discover India government schemes relevant to your farm and region.
          </p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          Personalizing for:{' '}
          <span className="font-semibold">
            {filters.district || 'Your district'}, {filters.state || 'Your state'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow md:grid-cols-4">
        <input
          type="text"
          value={filters.query}
          onChange={(event) => handleFilterChange('query', event.target.value)}
          placeholder="Search schemes, benefits, ministry..."
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
        />
        <select
          value={filters.category}
          onChange={(event) => handleFilterChange('category', event.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filters.state}
          onChange={(event) => handleFilterChange('state', event.target.value)}
          placeholder="State"
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
        />
        <input
          type="text"
          value={filters.district}
          onChange={(event) => handleFilterChange('district', event.target.value)}
          placeholder="District"
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
        />
        <div className="flex items-center justify-between gap-3 md:col-span-4">
          <div className="text-xs text-gray-500">
            {source?.usedFallback
              ? 'Showing curated scheme discovery results with official myScheme links.'
              : 'Showing results from the configured schemes API.'}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Search Schemes
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="mt-3 text-sm text-gray-600">Loading scheme information...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-900">No matching schemes found</h2>
          <p className="mt-2 text-sm text-gray-600">
            Try broadening your search or removing district-specific filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {schemes.map((scheme) => (
            <article key={scheme.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  {scheme.category}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {scheme.regionType === 'all-india' ? 'All India' : 'Regional'}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">{scheme.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{scheme.summary || scheme.description}</p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Benefits</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {(Array.isArray(scheme.benefits) ? scheme.benefits : [scheme.benefits])
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((benefit, index) => (
                        <li key={index}>- {benefit}</li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Eligibility</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {(Array.isArray(scheme.eligibility) ? scheme.eligibility : [scheme.eligibility])
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((item, index) => (
                        <li key={index}>- {item}</li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-800">Department:</span>{' '}
                  {scheme.ministry || 'Government of India'}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Region:</span>{' '}
                  {scheme.states?.length ? scheme.states.join(', ') : 'Available nationally'}
                  {scheme.districts?.length ? ` - Districts: ${scheme.districts.join(', ')}` : ''}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={scheme.applicationUrl || scheme.applyLink || scheme.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  View / Apply
                </a>
                {scheme.sourceUrl && (
                  <a
                    href={scheme.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Official Source
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;
