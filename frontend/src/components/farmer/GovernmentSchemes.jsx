import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const GovernmentSchemes = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    source: "fallback",
    region: { state: "", district: "", village: "" },
    total: 0,
    schemes: [],
  });

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/schemes/farmer");
      setData(response.data);
    } catch (err) {
      console.error("Error fetching government schemes:", err);
      setError("Unable to load schemes right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Government Schemes</h1>
          <p className="text-gray-600 mt-1">
            Region-based support programs for farmers in your area.
          </p>
        </div>
        <button
          onClick={fetchSchemes}
          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">Region:</span>
        <span className="text-sm font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
          State: {data.region?.state || "Not set"}
        </span>
        <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
          District: {data.region?.district || "Not set"}
        </span>
        <span className="text-sm font-medium bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-100">
          Village: {data.region?.village || "Not set"}
        </span>
        <span className="ml-auto text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
          Source: {data.source}
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Loading schemes...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      ) : data.schemes?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No schemes found for this region right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.schemes.map((scheme) => (
            <article
              key={scheme.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">{scheme.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{scheme.description}</p>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-gray-800">Benefits:</span>{" "}
                  <span className="text-gray-700">{scheme.benefits}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Eligibility:</span>{" "}
                  <span className="text-gray-700">{scheme.eligibility}</span>
                </p>
              </div>

              <a
                href={scheme.applyLink}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                View and Apply {"->"}
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;
