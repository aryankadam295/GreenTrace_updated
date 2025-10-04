import React from 'react';
import { Link } from 'react-router-dom';

const ForFarmers = () => {
  const features = [
    {
      icon: '📦',
      title: 'Upload Products',
      description: 'Easily list your crops with details like quantity, price, and location. Upload images to attract buyers.'
    },
    {
      icon: '🔬',
      title: 'Crop Diagnosis',
      description: 'Upload crop images and get AI-powered disease detection with severity levels and precautionary suggestions.'
    },
    {
      icon: '🚜',
      title: 'Rentals Management',
      description: 'Post your land or equipment for rental. Browse and request rentals from other farmers.'
    },
    {
      icon: '💰',
      title: 'My Deals',
      description: 'Track all your sales, negotiations, and transactions in one place. Manage buyer communications.'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'View detailed sales history, rental records, and export reports in PDF or Excel format.'
    },
    {
      icon: '🤝',
      title: 'Direct Sales',
      description: 'Sell directly to merchants and buyers without middlemen. Get fair prices for your produce.'
    }
  ];

  const dashboardFeatures = [
    {
      title: 'Product Upload',
      description: 'Simple form to add crop details',
      items: ['Crop name & category', 'Quantity & pricing', 'Location details', 'Image upload', 'Instant confirmation']
    },
    {
      title: 'Crop Diagnosis',
      description: 'AI-powered disease detection',
      items: ['Drag & drop image upload', 'Disease identification', 'Severity assessment', 'Treatment suggestions', 'Prevention tips']
    },
    {
      title: 'Rentals',
      description: 'Manage land & equipment rentals',
      items: ['Post rental availability', 'Browse rental requests', 'Land rental listings', 'Equipment rental', 'Track agreements']
    },
    {
      title: 'Reports',
      description: 'Comprehensive business insights',
      items: ['Sales history', 'Rental records', 'Revenue tracking', 'Export to PDF/Excel', 'Performance metrics']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Empowering Farmers with Technology
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Manage your farm business efficiently with our comprehensive dashboard. 
              Upload products, diagnose crops, manage rentals, and track your success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-green-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="bg-green-700 text-white font-semibold px-8 py-4 rounded-lg hover:bg-green-800 transition text-lg border-2 border-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Your Farmer Dashboard
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            A comprehensive control center designed specifically for farmers. 
            Access all tools and features from one intuitive interface.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dashboardFeatures.map((feature, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition"
              >
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your farmer account in minutes</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload Products</h3>
              <p className="text-gray-600">List your crops with details and images</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect with Buyers</h3>
              <p className="text-gray-600">Receive offers and negotiate deals</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
              <p className="text-gray-600">Track sales and expand your reach</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Farmers Choose GreenTrace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">💵</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Better Prices</h3>
                <p className="text-gray-600">
                  Eliminate middlemen and get fair market prices for your produce. 
                  Direct connection with buyers means more profit for you.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Quick Transactions</h3>
                <p className="text-gray-600">
                  Fast and secure payment processing. Track all your deals and 
                  transactions in real-time from your dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">AI-Powered Tools</h3>
                <p className="text-gray-600">
                  Use advanced crop diagnosis to detect diseases early. Get expert 
                  recommendations to protect your harvest.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Easy to Use</h3>
                <p className="text-gray-600">
                  Simple, intuitive interface designed for farmers. Access everything 
                  from your phone or computer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{backgroundColor: '#116466'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Farm Business?
          </h2>
          <p className="text-xl mb-8 text-white">
            Join thousands of farmers already using GreenTrace to grow their business.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-green-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForFarmers;
