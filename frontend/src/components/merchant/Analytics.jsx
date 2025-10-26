import React from 'react';

const Analytics = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  const {
    cartItemsCount,
    wishlistItemsCount,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalSpent,
    recentInquiries,
    favoriteCategories
  } = analytics;

  const getRecommendations = () => {
    const recommendations = [];
    
    if (cartItemsCount > 0) {
      recommendations.push({
        icon: '🛒',
        title: 'Complete Your Purchase',
        description: `You have ${cartItemsCount} items in your cart. Complete your purchase to get fresh products.`,
        action: 'Go to Cart',
        priority: 'high'
      });
    }

    if (wishlistItemsCount > 5) {
      recommendations.push({
        icon: '❤️',
        title: 'Review Your Wishlist',
        description: `You have ${wishlistItemsCount} items in your wishlist. Consider moving some to cart.`,
        action: 'View Wishlist',
        priority: 'medium'
      });
    }

    if (totalOrders === 0) {
      recommendations.push({
        icon: '🌟',
        title: 'Place Your First Order',
        description: 'Start exploring fresh agricultural products from local farmers.',
        action: 'Browse Products',
        priority: 'high'
      });
    }

    if (recentInquiries === 0 && totalOrders > 0) {
      recommendations.push({
        icon: '💬',
        title: 'Connect with Farmers',
        description: 'Send inquiries to farmers to discuss bulk orders or special requirements.',
        action: 'Browse Products',
        priority: 'low'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">Track your purchasing patterns and get personalized recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🛒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cart Items</p>
              <p className="text-2xl font-bold text-gray-900">{cartItemsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-2xl">❤️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
              <p className="text-2xl font-bold text-gray-900">{wishlistItemsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></span>
                <span className="text-gray-700">Pending Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                <span className="text-gray-700">Completed Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{completedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                <span className="text-gray-700">Recent Inquiries</span>
              </div>
              <span className="font-semibold text-gray-900">{recentInquiries}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Categories</h3>
          {favoriteCategories.length === 0 ? (
            <p className="text-gray-600">No purchase history yet</p>
          ) : (
            <div className="space-y-3">
              {favoriteCategories.slice(0, 5).map((category, index) => (
                <div key={category._id} className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-900 font-medium">{category._id}</span>
                    <span className="text-sm text-gray-600 ml-2">({category.count} orders)</span>
                  </div>
                  <span className="text-green-600 font-semibold">₹{category.totalSpent.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'high' ? 'border-red-400 bg-red-50' :
                rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                'border-blue-400 bg-blue-50'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{rec.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <button className="text-sm font-medium text-green-600 hover:text-green-800">
                      {rec.action} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {((completedOrders / Math.max(totalOrders, 1)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Order Success Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ₹{totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-600">Average Order Value</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {favoriteCategories.length}
            </div>
            <div className="text-sm text-gray-600">Categories Explored</div>
          </div>
        </div>
      </div>

      {/* Tips for Better Experience */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Better Experience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Add products to wishlist to track price changes</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Send inquiries to farmers for bulk discounts</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Check farmer profiles for quality assurance</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Order seasonal products for better prices</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
