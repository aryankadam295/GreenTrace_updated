import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const Wishlist = ({ onUpdate }) => {
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/merchant/wishlist');
      setWishlist(response.data.wishlist);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setMessage('Error loading wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await api.delete(`/merchant/wishlist/${productId}`);
      setWishlist(response.data.wishlist);
      setMessage('Item removed from wishlist');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error removing item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/merchant/cart', { productId, quantity: 1 });
      setMessage('Product added to cart successfully!');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding to cart');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm('Clear entire wishlist?')) return;

    try {
      await api.delete('/merchant/wishlist');
      setWishlist({ items: [] });
      setMessage('Wishlist cleared successfully');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error clearing wishlist');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading wishlist...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">Products you want to buy later</p>
        </div>
        
        {wishlist.items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('successfully') || message.includes('removed')
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {wishlist.items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600">Save products you love for later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.items.map(item => (
            <div key={item._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              {/* Product Image Placeholder */}
              <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center relative">
                <span className="text-4xl">🌾</span>
                
                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => removeFromWishlist(item.productId._id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Remove from wishlist"
                >
                  ×
                </button>
              </div>

              <div className="p-4">
                {/* Product Header */}
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {item.productId?.productName}
                  </h3>
                  <p className="text-sm text-gray-600">by {item.productId?.farmerName}</p>
                </div>

                {/* Product Details */}
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{item.productId?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{item.productId?.quantity} {item.productId?.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className="font-medium">{item.productId?.qualityGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium text-xs">
                      {item.productId?.farmerLocation?.district}, {item.productId?.farmerLocation?.state}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-xl font-bold text-green-600 mb-3">
                  ₹{item.productId?.price}/{item.productId?.unit}
                </div>

                {/* Added Date */}
                <div className="text-xs text-gray-500 mb-4">
                  Added on {formatDate(item.addedAt)}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => addToCart(item.productId._id)}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                  
                  <button
                    onClick={() => removeFromWishlist(item.productId._id)}
                    className="w-full bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    Remove from Wishlist
                  </button>
                </div>

                {/* Availability Status */}
                {item.productId?.status !== 'listed' && (
                  <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded">
                    ⚠️ This product is no longer available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist Stats */}
      {wishlist.items.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{wishlist.items.length}</div>
              <div className="text-sm text-gray-600">Items in Wishlist</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{wishlist.items.reduce((total, item) => total + (item.productId?.price || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(wishlist.items.map(item => item.productId?.category)).size}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
