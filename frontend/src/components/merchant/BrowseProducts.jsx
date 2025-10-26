import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BrowseProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    qualityGrade: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Standard'];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await api.get('/merchant/products', { params });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/merchant/products/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      qualityGrade: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/merchant/cart', { productId, quantity: 1 });
      setMessage('Product added to cart successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding to cart');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      await api.post('/merchant/wishlist', { productId });
      setMessage('Product added to wishlist successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding to wishlist');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Products</h1>
        <p className="text-gray-600">Discover quality agricultural products from farmers</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Product name, farmer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat._id} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="City, District, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Quality Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
            <select
              value={filters.qualityGrade}
              onChange={(e) => handleFilterChange('qualityGrade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Grades</option>
              {qualityGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="productName-asc">Name: A to Z</option>
              <option value="views-desc">Most Viewed</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`http://localhost:5000/uploads/products/${product.images[0]}`}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${product.images && product.images.length > 0 ? 'hidden' : ''}`}>
                    <span className="text-4xl">🌾</span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Product Header */}
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.productName}
                    </h3>
                    <p className="text-sm text-gray-600">by {product.farmerName}</p>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-medium">{product.quantity} {product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className="font-medium">{product.qualityGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harvest:</span>
                      <span className="font-medium">{formatDate(product.harvestDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium text-xs">{product.farmerLocation.district}, {product.farmerLocation.state}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-xl font-bold text-green-600 mb-4">
                    ₹{product.price}/{product.unit}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(product._id)}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => addToWishlist(product._id)}
                      className="bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage === index + 1
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseProducts;
