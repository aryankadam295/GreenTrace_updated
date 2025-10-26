import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    if (user.role === 'farmer') {
      return <Navigate to="/farmer-dashboard" replace />;
    } else if (user.role === 'merchant') {
      return <Navigate to="/merchant-dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has the right role
  return children;
};

export default ProtectedRoute;
