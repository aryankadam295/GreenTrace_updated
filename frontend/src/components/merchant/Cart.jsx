import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const Cart = ({ onUpdate }) => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/merchant/cart');
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setMessage('Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await api.put('/merchant/cart', { productId, quantity: newQuantity });
      setCart(response.data.cart);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating cart');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeItem = async (productId) => {
    if (!window.confirm('Remove this item from cart?')) return;

    try {
      const response = await api.delete(`/merchant/cart/${productId}`);
      setCart(response.data.cart);
      setMessage('Item removed from cart');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error removing item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Clear entire cart?')) return;

    try {
      await api.delete('/merchant/cart');
      setCart({ items: [], totalAmount: 0 });
      setMessage('Cart cleared successfully');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error clearing cart');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const proceedToCheckout = () => {
    setMessage('Checkout functionality coming soon!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading cart...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Cart</h1>
        <p className="text-gray-600">Review and manage your selected products</p>
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

      {cart.items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600">Start shopping to add products to your cart</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => (
              <div key={item._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image Placeholder */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌾</span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.productId?.productName}
                    </h3>
                    <p className="text-sm text-gray-600">by {item.productId?.farmerName}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{item.productId?.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality:</span>
                        <span>{item.productId?.qualityGrade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span>{item.productId?.quantity} {item.productId?.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 mb-2">
                      ₹{item.priceAtTime}/{item.productId?.unit}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 mb-3">
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating[item.productId._id]}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">
                        {updating[item.productId._id] ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        disabled={item.quantity >= item.productId?.quantity || updating[item.productId._id]}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="text-xl font-bold text-gray-900 mb-3">
                      ₹{(item.quantity * item.priceAtTime).toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.productId._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Items ({cart.items.length}):</span>
                  <span>₹{cart.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">₹{cart.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={proceedToCheckout}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Clear Cart
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                <div className="flex items-center space-x-2 mb-2">
                  <span>🚚</span>
                  <span>Free delivery on all orders</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span>🔒</span>
                  <span>Secure payment options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>↩️</span>
                  <span>Easy returns & refunds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
