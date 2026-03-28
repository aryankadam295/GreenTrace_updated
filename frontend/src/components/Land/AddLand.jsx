import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const documentFields = [
  { name: 'doc712', label: '7/12 Extract', hint: 'Ownership record or land extract' },
  { name: 'docAadhaar', label: 'Aadhaar Card', hint: 'Government identity proof' },
  { name: 'docTax', label: 'Property Tax Receipt', hint: 'Recent payment proof' }
];

const AddLand = ({ embedded = false, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area: '',
    village: '',
    district: '',
    state: '',
    rentPrice: '',
    rentDuration: 'yearly',
    selfDeclaration: false
  });
  const [documents, setDocuments] = useState({
    doc712: null,
    docAadhaar: null,
    docTax: null,
    landImage: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files?.length) {
      setDocuments((prev) => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      area: '',
      village: '',
      district: '',
      state: '',
      rentPrice: '',
      rentDuration: 'yearly',
      selfDeclaration: false
    });
    setDocuments({
      doc712: null,
      docAadhaar: null,
      docTax: null,
      landImage: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.selfDeclaration) {
      setError('You must self-declare that the land is not under dispute.');
      return;
    }

    if (!documents.doc712 || !documents.docAadhaar || !documents.docTax) {
      setError('Please upload all three required documents (7/12, Aadhaar, Tax Receipt).');
      return;
    }

    setError(null);
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    data.append('documents', documents.doc712);
    data.append('documents', documents.docAadhaar);
    data.append('documents', documents.docTax);
    if (documents.landImage) {
      data.append('landImage', documents.landImage);
    }

    try {
      await api.post('/land', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Land listing submitted successfully and is pending verification.');
      resetForm();

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate('/land-rentals');
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? 'p-6 md:p-8' : 'min-h-screen bg-gray-50 px-4 py-8'}>
      <div className={embedded ? '' : 'mx-auto max-w-5xl'}>
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">List Land for Rent</h2>
          <p className="mt-2 text-gray-600">
            Share your land details, upload ownership documents, and submit the listing for review.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Fertile 5 Acres in Pune"
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe soil quality, irrigation, road access, and nearby facilities. Optional."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Area</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="e.g. 5 Acres"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Rent Details</label>
                    <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                      <input
                        type="number"
                        name="rentPrice"
                        value={formData.rentPrice}
                        onChange={handleChange}
                        placeholder="e.g. 50000"
                        required
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                      <select
                        name="rentDuration"
                        value={formData.rentDuration}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Village</label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Verification Checklist</h3>
              <p className="mt-2 text-sm text-gray-600">
                Upload all three documents and confirm legal ownership to keep the review process smooth.
              </p>
            <div className="mt-5 space-y-3 text-sm text-gray-700">
                <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">One land image for the public listing card</div>
                <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">Clear document scans or PDFs</div>
                <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">Accurate village, district, and state</div>
                <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">Monthly or yearly rent with land area details</div>
                <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">Confirmation that the land is dispute-free</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Listing Image</h3>
              <p className="mt-1 text-sm text-gray-600">Upload a photo of the land to make the listing easier to browse.</p>
            </div>
            <label className="block rounded-2xl border border-dashed border-green-300 bg-green-50/60 p-4 transition hover:border-green-500 hover:bg-green-50">
              <span className="block text-sm font-semibold text-gray-900">Land Photo</span>
              <span className="mt-1 block text-xs text-gray-600">Optional. JPG or PNG recommended.</span>
              <input
                type="file"
                name="landImage"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-4 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800"
              />
              {documents.landImage && (
                <span className="mt-3 block text-xs font-medium text-green-700">
                  Selected: {documents.landImage.name}
                </span>
              )}
            </label>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Ownership Verification Documents</h3>
              <p className="mt-1 text-sm text-gray-600">Allowed formats: PDF, JPG, PNG. Maximum 25MB for each file.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {documentFields.map((field) => (
                <label
                  key={field.name}
                  className="block rounded-2xl border border-dashed border-green-300 bg-green-50/60 p-4 transition hover:border-green-500 hover:bg-green-50"
                >
                  <span className="block text-sm font-semibold text-gray-900">{field.label}</span>
                  <span className="mt-1 block text-xs text-gray-600">{field.hint}</span>
                  <input
                    type="file"
                    name={field.name}
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    required
                    className="mt-4 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800"
                  />
                  {documents[field.name] && (
                    <span className="mt-3 block text-xs font-medium text-green-700">
                      Selected: {documents[field.name].name}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                name="selfDeclaration"
                checked={formData.selfDeclaration}
                onChange={handleChange}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
              />
              <span>
                I legally declare that I am the rightful owner of this land and that it is not under any judicial or legal dispute.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {!embedded && (
              <button
                type="button"
                onClick={() => navigate('/land-rentals')}
                className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to Land Rentals
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit Land for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLand;
