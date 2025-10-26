import React from 'react';
import { Link } from 'react-router-dom';

const ForAdmin = () => {
  const features = [
    {
      icon: '👥',
      title: 'User Management',
      description: 'Manage farmers and merchants, view user profiles, track activities, and handle user verification.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Monitor platform performance, revenue tracking, user engagement metrics, and business insights.'
    },
    {
      icon: '💰',
      title: 'Transaction Management',
      description: 'Oversee all transactions, commission tracking, payment processing, and financial reporting.'
    },
    {
      icon: '🔍',
      title: 'Content Moderation',
      description: 'Review product listings, manage reported content, ensure quality standards, and platform compliance.'
    },
    {
      icon: '⚙️',
      title: 'System Configuration',
      description: 'Configure platform settings, manage categories, set commission rates, and system maintenance.'
    },
    {
      icon: '📈',
      title: 'Business Intelligence',
      description: 'Advanced reporting, trend analysis, market insights, and strategic decision support tools.'
    }
  ];

  const benefits = [
    {
      icon: '🎯',
      title: 'Complete Control',
      description: 'Full administrative access to all platform features and user management capabilities.'
    },
    {
      icon: '📱',
      title: 'Real-time Monitoring',
      description: 'Live dashboard with real-time updates on user activities, transactions, and system health.'
    },
    {
      icon: '🔒',
      title: 'Security Management',
      description: 'Advanced security controls, user verification, fraud detection, and system protection.'
    },
    {
      icon: '📋',
      title: 'Comprehensive Reports',
      description: 'Detailed analytics, financial reports, user statistics, and business performance metrics.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              GreenTrace Admin Portal
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Comprehensive administrative dashboard for managing the GreenTrace 
              agricultural marketplace platform with advanced analytics and controls.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                state={{ fromAdmin: true }}
                className="bg-red-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-red-700 transition text-lg"
              >
                🔐 Admin Login
              </Link>
              <button className="bg-gray-700 text-white font-semibold px-8 py-4 rounded-lg hover:bg-gray-600 transition text-lg">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Administrative Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools and insights to manage and grow your agricultural marketplace platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Why Choose GreenTrace Admin?
            </h2>
            <p className="text-xl text-gray-600">
              Advanced administrative capabilities for effective platform management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="text-3xl">{benefit.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Platform Overview
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">1,200+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">₹2.8M</div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">3,400+</div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">98%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-2xl">🔐</div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Secure Admin Access
                </h3>
                <p className="text-yellow-700">
                  Admin access is restricted and requires proper authentication. 
                  All administrative actions are logged and monitored for security purposes.
                  Contact system administrator for access credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Manage Your Platform?
          </h2>
          <p className="text-xl mb-8">
            Access the comprehensive admin dashboard to monitor and manage your agricultural marketplace.
          </p>
          <Link
            to="/login"
            state={{ fromAdmin: true }}
            className="inline-block bg-red-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-red-700 transition text-lg"
          >
            🔐 Access Admin Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForAdmin;
