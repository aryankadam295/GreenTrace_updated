import React from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <main className="min-h-screen bg-[#F6F8F1]">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">Contact</p>
          <h1 className="mb-4 text-4xl font-bold text-green-950">Get in touch with GreenTrace</h1>
          <p className="max-w-3xl text-lg text-gray-700">
            Need help with your farmer account, merchant orders, land rentals, equipment, or admin access?
            Reach out and we will help you move forward.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-green-950">Email</h2>
            <p className="text-gray-600">support@greentrace.in</p>
          </div>

          <div className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-green-950">Phone</h2>
            <p className="text-gray-600">+91 98765 43210</p>
          </div>

          <div className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-green-950">Hours</h2>
            <p className="text-gray-600">Monday to Saturday, 9 AM - 6 PM</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-green-950">What to include</h2>
          <p className="text-gray-700">
            Please mention your role, registered email or phone number, and a short description of the issue.
            For payment or order questions, include the order or transaction reference if available.
          </p>
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

export default Contact;
