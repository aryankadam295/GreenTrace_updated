import React from 'react';
import { Link } from 'react-router-dom';

const ForMerchants = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Browse Products',
      description: 'Search and filter fresh produce by crop type, location, and price range. Find exactly what you need.'
    },
    {
      icon: '🛒',
      title: 'My Purchases',
      description: 'Track all your orders, deliveries, and purchase history in one convenient dashboard.'
    },
    {
      icon: '👥',
      title: 'Community Forum',
      description: 'Connect with other merchants, share market trends, trading tips, and explore partnership opportunities.'
    },
    {
      icon: '🏗️',
      title: 'Rentals',
      description: 'Post or browse land and equipment rentals. Request and accept rental agreements seamlessly.'
    },
    {
      icon: '📈',
      title: 'Reports & Analytics',
      description: 'View comprehensive graphs and tables showing purchases, rentals, and community activity.'
    },
    {
      icon: '💬',
      title: 'Direct Communication',
      description: 'Chat directly with farmers, negotiate prices, and make offers in real-time.'
    }
  ];

  const dashboardFeatures = [
    {
      title: 'Browse Products',
      description: 'Advanced search and filtering',
      items: ['Search by crop type', 'Filter by location', 'Price range selection', 'Farmer ratings', 'Make offers instantly']
    },
    {
      title: 'Community',
      description: 'Forum-style networking',
      items: ['Create posts', 'Comment & reply', 'Like & share', 'Market trends discussion', 'Partnership opportunities']
    },
    {
      title: 'Rentals',
      description: 'Land & equipment marketplace',
      items: ['Post available resources', 'Browse listings', 'Request rentals', 'Accept agreements', 'Track rental history']
    },
    {
      title: 'Reports',
      description: 'Business intelligence',
      items: ['Purchase analytics', 'Rental statistics', 'Community engagement', 'Export reports', 'Performance graphs']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Source Fresh Produce Directly from Farmers
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect with verified farmers, browse quality products, and manage your 
              purchases efficiently. Join a thriving merchant community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg hover:bg-blue-800 transition text-lg border-2 border-white"
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
            Everything You Need to Source Better
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
            Your Merchant Dashboard
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            A powerful platform designed for retailers and wholesalers. 
            Manage your sourcing, purchases, and business relationships efficiently.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dashboardFeatures.map((feature, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition"
              >
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
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
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your merchant account quickly</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Browse Products</h3>
              <p className="text-gray-600">Search and filter fresh produce</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Make Offers</h3>
              <p className="text-gray-600">Negotiate directly with farmers</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
              <p className="text-gray-600">Build lasting supplier relationships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Join the Merchant Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-xl mb-3">Market Trends</h3>
              <p className="text-gray-600">
                Stay updated with the latest market prices, seasonal trends, and 
                demand forecasts shared by the community.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-semibold text-xl mb-3">Trading Tips</h3>
              <p className="text-gray-600">
                Learn from experienced merchants, share best practices, and 
                discover new sourcing strategies.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-xl mb-3">Partnerships</h3>
              <p className="text-gray-600">
                Find potential business partners, collaborate on bulk orders, 
                and expand your network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Merchants Choose GreenTrace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🌱</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Fresh Quality</h3>
                <p className="text-gray-600">
                  Source directly from farmers to ensure the freshest produce. 
                  Reduce supply chain time and improve product quality.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Better Margins</h3>
                <p className="text-gray-600">
                  Eliminate middlemen costs and negotiate directly with farmers. 
                  Improve your profit margins significantly.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Verified Farmers</h3>
                <p className="text-gray-600">
                  All farmers are verified and rated by the community. 
                  Build trust and long-term supplier relationships.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Easy Management</h3>
                <p className="text-gray-600">
                  Manage all your purchases, communications, and reports from 
                  one intuitive dashboard.
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
            Ready to Source Smarter?
          </h2>
          <p className="text-xl mb-8 text-white">
            Join hundreds of merchants already using GreenTrace to connect with quality farmers.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForMerchants;
