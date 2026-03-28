import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import EquipmentDetail from './EquipmentDetail';
import { getMediaUrl } from '../../../utils/media';

const CATEGORIES = [
  'All',
  'Tractor',
  'Harvester',
  'Irrigation',
  'Plough',
  'Seeder',
  'Sprayer',
  'Thresher',
  'Tools',
  'Transport',
  'Others'
];

const EquipmentBrowse = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({ categories: [], states: [] });
  
  // Mobile filter panel
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, [page, category, sortBy, sortOrder]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sortBy,
        sortOrder
      };
      
      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await equipmentAPI.browseEquipment(params);
      setEquipment(response.data.equipment);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
      setFilterOptions(response.data.filters || { categories: [], states: [] });
    } catch (err) {
      setError('Failed to load equipment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEquipment();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedEquipment) {
    return (
      <EquipmentDetail 
        equipmentId={selectedEquipment} 
        onBack={() => setSelectedEquipment(null)} 
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search equipment by name, description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden px-6 py-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            Filters {showFilters ? '▲' : '▼'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className={`mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="pricePerDay-asc">Price: Low to High</option>
                <option value="pricePerDay-desc">Price: High to Low</option>
                <option value="averageRating-desc">Top Rated</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Found <span className="font-semibold">{total}</span> equipment{total !== 1 ? 's' : ''}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-red-600">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🚜</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No equipment found</h3>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          {/* Equipment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {equipment.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedEquipment(item._id)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48">
                  <img
                    src={item.images?.[0] 
                      ? getMediaUrl(item.images[0], 'equipment')
                      : '/placeholder-equipment.png'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40">🚜</text></svg>';
                    }}
                  />
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white rounded-full text-xs">
                    {item.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="mr-1">📍</span>
                    {item.location?.village}, {item.location?.district}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-green-600">₹{item.pricePerDay}</span>
                      <span className="text-sm text-gray-500">/day</span>
                    </div>
                    
                    {item.averageRating > 0 && (
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="font-medium">{item.averageRating.toFixed(1)}</span>
                        <span className="text-gray-400 ml-1">({item.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-sm text-gray-500">
                    <span className="mr-1">👤</span>
                    {item.ownerName}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.min(Math.max(page - 2, 1), Math.max(totalPages - 4, 1)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg ${
                        page === pageNum
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EquipmentBrowse;
