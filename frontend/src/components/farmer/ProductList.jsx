import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getMediaUrl } from '../../utils/media';

const ProductList = ({ refreshKey = 0, embedded = false }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filter, refreshKey]);

  const fetchProducts = async () => {
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/products/farmer${statusParam}`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      setMessage('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      setMessage('Error deleting product');
    }
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      await api.put(`/products/${productId}`, { status: newStatus });
      setMessage('Product status updated successfully');
      fetchProducts();
    } catch (error) {
      setMessage('Error updating product status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'listed': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'removed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
          <p className="text-gray-600">Manage your listed products</p>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Products' },
              { key: 'listed', label: 'Listed' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'sold', label: 'Sold' },
              { key: 'expired', label: 'Expired' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Start by uploading your first product!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getMediaUrl(product.images[0], 'products')}
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
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.productName}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Product Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium text-green-600">₹{product.price}/{product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className="font-medium">{product.qualityGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harvest Date:</span>
                    <span className="font-medium">{formatDate(product.harvestDate)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>👁️ {product.views}</span>
                    <span>💬 {product.inquiries}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(product.createdAt)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  
                  {product.status === 'listed' && (
                    <button
                      onClick={() => handleStatusUpdate(product._id, 'removed')}
                      className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  
                  {product.status === 'removed' && (
                    <button
                      onClick={() => handleStatusUpdate(product._id, 'listed')}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Re-list
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <p className="text-gray-600 mb-4">Edit functionality will be implemented here</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
