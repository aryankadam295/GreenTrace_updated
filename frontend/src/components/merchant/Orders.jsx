import React, { useState } from 'react';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Mock data for demonstration
  const mockOrders = [
    {
      id: 'ORD-123456',
      date: '2024-01-15',
      status: 'delivered',
      items: [
        { name: 'Fresh Tomatoes', quantity: 10, unit: 'kg', price: 25, farmer: 'John Farmer' },
        { name: 'Organic Rice', quantity: 5, unit: 'kg', price: 60, farmer: 'Jane Farmer' }
      ],
      total: 550,
      deliveryAddress: 'Mumbai, Maharashtra'
    },
    {
      id: 'ORD-123457',
      date: '2024-01-20',
      status: 'shipped',
      items: [
        { name: 'Fresh Wheat', quantity: 20, unit: 'kg', price: 30, farmer: 'Bob Farmer' }
      ],
      total: 600,
      deliveryAddress: 'Pune, Maharashtra'
    },
    {
      id: 'ORD-123458',
      date: '2024-01-22',
      status: 'pending',
      items: [
        { name: 'Organic Vegetables', quantity: 15, unit: 'kg', price: 40, farmer: 'Alice Farmer' }
      ],
      total: 600,
      deliveryAddress: 'Delhi, Delhi'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredOrders = activeTab === 'all' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage your purchase history</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
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

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {activeTab === 'all' 
              ? 'You haven\'t placed any orders yet' 
              : `No ${activeTab} orders found`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {formatDate(order.date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Delivery to: {order.deliveryAddress}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="text-lg font-bold text-gray-900 mt-2">
                      ₹{order.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🌾</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">by {item.farmer}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.unit} × ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    {order.status === 'delivered' && (
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Rate & Review
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Cancel Order
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                  
                  <div className="flex space-x-3">
                    {(order.status === 'shipped' || order.status === 'delivered') && (
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        Track Order
                      </button>
                    )}
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Statistics */}
      {mockOrders.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{mockOrders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ₹{mockOrders.reduce((total, order) => total + order.total, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {mockOrders.filter(order => order.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {mockOrders.filter(order => order.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Completed Orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-blue-600 text-xl mr-2">ℹ️</span>
          <div>
            <p className="text-blue-800 font-medium">Order Management System</p>
            <p className="text-blue-700 text-sm">
              Full order management functionality is coming soon. This is a preview of the interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
