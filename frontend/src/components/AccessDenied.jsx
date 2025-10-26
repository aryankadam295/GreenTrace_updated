import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AccessDenied = ({ requiredRole, currentUserRole }) => {
  const { user } = useAuth();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'farmer': return 'Farmer';
      case 'merchant': return 'Merchant';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getCorrectDashboard = (role) => {
    switch (role) {
      case 'farmer': return '/farmer-dashboard';
      case 'merchant': return '/merchant-dashboard';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            This page is only accessible to {getRoleDisplayName(requiredRole)}s.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium text-yellow-800">
                You are logged in as: {getRoleDisplayName(currentUserRole || user?.role)}
              </p>
              <p className="text-sm text-yellow-700">
                Required role: {getRoleDisplayName(requiredRole)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to={getCorrectDashboard(currentUserRole || user?.role)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors inline-block"
          >
            Go to My Dashboard
          </Link>
          
          <Link
            to="/"
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors inline-block"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
