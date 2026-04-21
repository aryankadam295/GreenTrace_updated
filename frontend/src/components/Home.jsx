import React from "react";
import { Link } from "react-router-dom";
const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Empowering Farmers, Connecting Buyers
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Showcase your fresh produce and reach buyers directly. Your farm, your marketplace.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/add-product"
                className="bg-white text-green-600 font-semibold px-6 py-3 rounded-md hover:bg-gray-100 transition"
              >
                Add Product
              </Link>
              <Link
                to="/signup"
                className="bg-green-700 bg-opacity-90 text-white font-semibold px-6 py-3 rounded-md hover:bg-green-800 transition"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">
            Why GreenTrace?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-xl mb-2">Direct Sales</h3>
              <p className="text-gray-600">
                Farmers can sell their produce directly to buyers without middlemen.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-xl mb-2">Verified Buyers</h3>
              <p className="text-gray-600">
                All buyers and farmers are verified for a trustworthy marketplace.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-xl mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">
                Instant notifications for new orders, chats, and marketplace updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16" style={{backgroundColor: '#00695C'}}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to Grow Your Farm Business?
          </h2>
          <p className="text-white mb-6">
            Join GreenTrace today and start connecting with buyers across the country.
          </p>
          <Link
            to="/signup"
            className="bg-white px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
            style={{color: '#00695C'}}
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
