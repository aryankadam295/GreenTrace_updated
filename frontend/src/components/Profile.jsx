import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UpiSettings from './farmer/UpiSettings';

const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const activeSection = new URLSearchParams(location.search).get('section');
  const showUpiSettings = user?.role === 'farmer' && activeSection === 'upi';

  const dashboardPath =
    user?.role === 'merchant'
      ? '/merchant-dashboard'
      : user?.role === 'admin'
        ? '/admin-dashboard'
        : '/farmer-dashboard?section=overview';

  const details = [
    { label: 'Full Name', value: user?.fullName },
    { label: 'Role', value: user?.role },
    { label: 'Email', value: user?.email },
    { label: 'Phone', value: user?.phoneNumber },
    { label: 'Business Name', value: user?.businessName },
  ].filter((item) => item.value);

  return (
    <main className="min-h-screen bg-[#F6F8F1] px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">Profile</p>
            <h1 className="text-4xl font-bold text-green-950">
              {showUpiSettings ? 'UPI Settings' : user?.fullName || 'Your Profile'}
            </h1>
            <p className="mt-2 text-gray-700">
              {showUpiSettings
                ? 'Manage the UPI ID merchants use to pay you directly.'
                : 'View your GreenTrace account details and quick account actions.'}
            </p>
          </div>
          <Link
            to={dashboardPath}
            className="self-start rounded-md bg-[#214E34] px-5 py-2.5 font-semibold text-white transition hover:bg-[#123321]"
          >
            Back to Dashboard
          </Link>
        </div>

        {showUpiSettings ? (
          <UpiSettings />
        ) : (
        <div className="rounded-lg border border-green-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-green-100 bg-[#F7FAF2] p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-700 text-2xl font-bold text-white">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-green-950">{user?.fullName}</h2>
              <p className="capitalize text-green-700">{user?.role}</p>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="rounded-lg border border-green-100 bg-[#FBFCF7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{item.label}</p>
                <p className="mt-1 break-words text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {user?.role === 'farmer' && (
            <div className="border-t border-green-100 p-6">
              <Link
                to="/profile?section=upi"
                className="inline-flex rounded-md border border-green-200 bg-green-50 px-4 py-2 font-semibold text-green-800 transition hover:bg-green-100"
              >
                Manage UPI Settings
              </Link>
            </div>
          )}
        </div>
        )}
      </section>
    </main>
  );
};

export default Profile;
