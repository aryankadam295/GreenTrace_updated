import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForFarmers from './components/ForFarmers';
import ForMerchants from './components/ForMerchants';
import ForAdmin from './components/admin/ForAdmin';
import FarmerDashboard from './components/FarmerDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import AdminDashboard from './components/admin/admindashboard';
import AboutUs from './components/Aboutus';
import ProtectedRoute from './components/ProtectedRoute';
import AccessDenied from './components/AccessDenied';
import WeatherPage from './components/farmer/WeatherPage';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/for-farmers" element={<ForFarmers />} />
          <Route path="/for-merchants" element={<ForMerchants />} />
          <Route path="/for-admin" element={<ForAdmin />} />
          <Route path="/about" element={<AboutUs />} />

          {/* Protected Farmer Routes */}
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/farmer-weather"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <WeatherPage />
              </ProtectedRoute>
            }
          />

          {/* Merchant Dashboard Route */}
          <Route
            path="/merchant-dashboard"
            element={
              <ProtectedRoute allowedRoles={['merchant']}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard Route */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Access Denied Route */}
          <Route
            path="/access-denied"
            element={<AccessDenied requiredRole="farmer" />}
          />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
