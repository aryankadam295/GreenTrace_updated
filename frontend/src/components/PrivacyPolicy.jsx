import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-[#F6F8F1]">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">Privacy Policy</p>
          <h1 className="mb-4 text-4xl font-bold text-green-950">How GreenTrace handles your information</h1>
          <p className="max-w-3xl text-lg text-gray-700">
            This page explains the basic information GreenTrace uses to run marketplace, farm management,
            payment, land rental, and equipment rental features.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-green-950">Information we collect</h2>
            <p className="text-gray-700">
              We may collect account details such as name, email, phone number, role, business name,
              product listings, inquiries, orders, UPI details, land listings, equipment bookings, and chat messages.
            </p>
          </section>

          <section className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-green-950">How we use it</h2>
            <p className="text-gray-700">
              We use this information to authenticate users, connect farmers and merchants, process marketplace
              activity, support rentals, show analytics, improve safety, and provide support.
            </p>
          </section>

          <section className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-green-950">Sharing and security</h2>
            <p className="text-gray-700">
              Relevant profile, listing, order, inquiry, and contact details may be visible to users involved in
              a transaction or conversation. We aim to protect stored information and limit access to what is needed
              for GreenTrace features to work.
            </p>
          </section>

          <section className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-green-950">Your choices</h2>
            <p className="text-gray-700">
              You can update account and listing details from your dashboard. For help with account data or access,
              contact support@greentrace.in.
            </p>
          </section>
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-md bg-[#214E34] px-5 py-2.5 font-semibold text-white transition hover:bg-[#123321]"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
