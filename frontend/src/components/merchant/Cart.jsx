import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import PayPalCheckout from './UpiCheckout';
import {
  convertQuantity,
  getCompatibleUnits,
  getDefaultPurchaseUnit,
  getUnitStep
} from '../../utils/unitConversion';

const Cart = ({ onUpdate }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [itemInputs, setItemInputs] = useState({});

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/merchant/cart');
      setCart(res.data.cart);
    } catch (err) {
      setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (item) => (item?.productId && typeof item.productId === 'object' ? item.productId : {});
  const getProductId = (item) => String(getProduct(item)?._id || item?.productId || '');

  const getItemInput = (item, inputsState = itemInputs) => {
    const product = getProduct(item);
    const productId = getProductId(item);
    const existing = inputsState[productId];

    if (existing) {
      return existing;
    }

    const displayUnit = getDefaultPurchaseUnit(product.unit);
    return {
      unit: displayUnit,
      quantity: convertQuantity(item.quantity, product.unit, displayUnit).toFixed(3)
    };
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!cart?.items) return;

    const mapped = {};
    cart.items.forEach((item) => {
      const product = getProduct(item);
      const productId = getProductId(item);
      const displayUnit = getDefaultPurchaseUnit(product.unit);
      mapped[productId] = {
        unit: displayUnit,
        quantity: convertQuantity(item.quantity, product.unit, displayUnit).toFixed(3)
      };
    });

    setItemInputs(mapped);
  }, [cart]);

  const removeItem = async (productId) => {
    setRemovingItem(productId);
    try {
      await api.delete(`/merchant/cart/${productId}`);
      await fetchCart();
      onUpdate && onUpdate();
    } catch (err) {
      setError('Failed to remove item.');
    } finally {
      setRemovingItem(null);
    }
  };

  const updateItemQuantity = async (item, displayQuantityValue, selectedUnit) => {
    const productId = getProductId(item);
    const product = getProduct(item);
    const displayQuantity = Number(displayQuantityValue);
    const availableInSelectedUnit = convertQuantity(Number(product.quantity || 0), product.unit, selectedUnit);

    if (!Number.isFinite(displayQuantity) || displayQuantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    if (displayQuantity > availableInSelectedUnit) {
      setError(`Only ${availableInSelectedUnit.toFixed(3)} ${selectedUnit} available.`);
      return;
    }

    const quantityInProductUnit = convertQuantity(displayQuantity, selectedUnit, product.unit);

    setUpdatingItem(productId);
    try {
      const res = await api.put('/merchant/cart', { productId, quantity: quantityInProductUnit });
      setCart(res.data.cart);
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handlePaymentSuccess = (data) => {
    setPaymentSuccess({
      orderId: data.orderId,
      message: 'Payment successful! Farmers have been notified.',
    });
    fetchCart();
    onUpdate && onUpdate();
  };

  const handlePaymentError = (msg) => {
    setError(typeof msg === 'string' ? msg : 'Payment failed. Please try again.');
  };

  const cartTotal = cart?.items?.reduce(
    (sum, item) => sum + item.quantity * item.priceAtTime,
    0
  ) || 0;

  const cartItemCount = cart?.items?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <span className="text-4xl">✅</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 text-sm">{paymentSuccess.message}</p>
          {paymentSuccess.orderId && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
              <span>📦</span>
              <span>Order ID: {paymentSuccess.orderId}</span>
            </div>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-blue-800 text-sm">Farmers have been notified</p>
              <p className="text-blue-600 text-xs mt-1">
                All farmers involved in this order will see the payment confirmation in their Inquiries section on the dashboard.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setPaymentSuccess(null); fetchCart(); }}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Cart</h1>
        <p className="text-gray-500 text-sm">
          {cartItemCount > 0
            ? `${cartItemCount} item${cartItemCount > 1 ? 's' : ''} ready to order`
            : 'Your cart is empty'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {cartItemCount === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
          <p className="text-gray-400 text-sm">Browse products and add them to your cart to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => {
              const product = getProduct(item);
              const productId = getProductId(item);
              const input = getItemInput(item);
              const availableInSelectedUnit = convertQuantity(Number(product.quantity || 0), product.unit, input.unit);
              const unitOptions = getCompatibleUnits(product.unit);

              return (
                <div
                  key={productId || item._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    🌾
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.productName || 'Product'}</p>
                    <p className="text-sm text-gray-500">By {product.farmerName || 'Farmer'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ₹{item.priceAtTime}/{product.unit || 'unit'}
                      </span>
                      <span className="text-xs text-gray-400">Available: {availableInSelectedUnit.toFixed(3)} {input.unit}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {unitOptions.length > 1 && (
                        <select
                          value={input.unit}
                          onChange={(e) => {
                            const nextUnit = e.target.value;
                            const convertedQty = convertQuantity(Number(input.quantity), input.unit, nextUnit);
                            setItemInputs((prev) => ({
                              ...prev,
                              [productId]: {
                                unit: nextUnit,
                                quantity: Number(convertedQty.toFixed(3)).toString()
                              }
                            }));
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          {unitOptions.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      )}

                      <input
                        type="number"
                        min={getUnitStep(input.unit)}
                        step={getUnitStep(input.unit)}
                        value={input.quantity}
                        className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                        onChange={(e) =>
                          setItemInputs((prev) => ({
                            ...prev,
                            [productId]: {
                              ...input,
                              quantity: e.target.value
                            }
                          }))
                        }
                        onBlur={(e) => updateItemQuantity(item, e.target.value, input.unit)}
                      />
                      {updatingItem === productId && (
                        <span className="text-xs text-gray-500">Updating...</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-700 text-lg">
                      ₹{(item.quantity * item.priceAtTime).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(productId)}
                      disabled={removingItem === productId}
                      className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors disabled:opacity-50"
                    >
                      {removingItem === productId ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h2>

              <div className="space-y-2 mb-4">
                {cart.items.map((item) => (
                  <div key={getProductId(item) || item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">{getProduct(item).productName || 'Product'} ×{item.quantity.toFixed(3)}</span>
                    <span className="font-medium text-gray-800 flex-shrink-0">
                      ₹{(item.quantity * item.priceAtTime).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mb-1">
                <div className="flex justify-between font-bold text-base">
                  <span className="text-gray-800">Total</span>
                  <span className="text-green-700">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <PayPalCheckout
                cartTotal={cartTotal}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={cartItemCount === 0}
              />

              <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                After payment, all farmers in this order will be notified automatically in their dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
