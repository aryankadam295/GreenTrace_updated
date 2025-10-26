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

  const performanceMetrics = [
    {
      title: 'Total Products',
      value: analytics.totalProducts,
      icon: '📦',
      color: 'bg-blue-500',
      description: 'Products you have listed'
    },
    {
      title: 'Listed Products',
      value: analytics.listedProducts,
      icon: '✅',
      color: 'bg-green-500',
      description: 'Currently active listings'
    },
    {
      title: 'Sold Products',
      value: analytics.soldProducts,
      icon: '💰',
      color: 'bg-yellow-500',
      description: 'Successfully sold items'
    },
    {
      title: 'Total Views',
      value: analytics.totalViews,
      icon: '👁️',
      color: 'bg-purple-500',
      description: 'Product page views'
    },
    {
      title: 'Total Inquiries',
      value: analytics.totalInquiries,
      icon: '💬',
      color: 'bg-indigo-500',
      description: 'Merchant inquiries received'
    },
    {
      title: 'Recent Inquiries',
      value: analytics.recentInquiries,
      icon: '🔔',
      color: 'bg-red-500',
      description: 'New inquiries (last 7 days)'
    }
  ];

  const calculateConversionRate = () => {
    if (analytics.totalViews === 0) return 0;
    return ((analytics.totalInquiries / analytics.totalViews) * 100).toFixed(1);
  };

  const calculateSalesRate = () => {
    if (analytics.totalProducts === 0) return 0;
    return ((analytics.soldProducts / analytics.totalProducts) * 100).toFixed(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Track your farm business performance</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${metric.color} text-white`}>
                <span className="text-2xl">{metric.icon}</span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">₹{analytics.totalRevenue}</div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              ₹{analytics.totalProducts > 0 ? (analytics.totalRevenue / analytics.totalProducts).toFixed(0) : 0}
            </div>
            <p className="text-sm text-gray-600">Average per Product</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              ₹{analytics.soldProducts > 0 ? (analytics.totalRevenue / analytics.soldProducts).toFixed(0) : 0}
            </div>
            <p className="text-sm text-gray-600">Average Sale Value</p>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Conversion Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">View to Inquiry Rate</span>
              <span className="font-semibold text-blue-600">{calculateConversionRate()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(calculateConversionRate(), 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sales Success Rate</span>
              <span className="font-semibold text-green-600">{calculateSalesRate()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min(calculateSalesRate(), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Listings</span>
              <span className="font-semibold">{analytics.listedProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Inquiries</span>
              <span className="font-semibold text-yellow-600">{analytics.recentInquiries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Sales</span>
              <span className="font-semibold text-green-600">{analytics.soldProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Engagement</span>
              <span className="font-semibold text-purple-600">{analytics.totalViews + analytics.totalInquiries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {analytics.totalProducts === 0 && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded">
              <span className="text-blue-600 text-xl">💡</span>
              <div>
                <p className="font-medium text-blue-800">Start listing your products</p>
                <p className="text-sm text-blue-600">Upload your first product to start selling</p>
              </div>
            </div>
          )}
          
          {analytics.totalViews > 0 && calculateConversionRate() < 5 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded">
              <span className="text-yellow-600 text-xl">⚡</span>
              <div>
                <p className="font-medium text-yellow-800">Improve product descriptions</p>
                <p className="text-sm text-yellow-600">Your conversion rate is low. Try adding better descriptions and images</p>
              </div>
            </div>
          )}
          
          {analytics.recentInquiries > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded">
              <span className="text-green-600 text-xl">🎉</span>
              <div>
                <p className="font-medium text-green-800">You have pending inquiries!</p>
                <p className="text-sm text-green-600">Respond quickly to increase your sales chances</p>
              </div>
            </div>
          )}
          
          {analytics.soldProducts > 0 && calculateSalesRate() > 50 && (
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded">
              <span className="text-purple-600 text-xl">🚀</span>
              <div>
                <p className="font-medium text-purple-800">Great sales performance!</p>
                <p className="text-sm text-purple-600">Consider listing more products to increase revenue</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
