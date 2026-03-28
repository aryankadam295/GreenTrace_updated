import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import EquipmentUpload from './EquipmentUpload';
import { getMediaUrl } from '../../../utils/media';

const MyEquipment = ({ onRefresh }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMyEquipment();
  }, [page, statusFilter]);

  const fetchMyEquipment = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await equipmentAPI.getMyEquipment(params);
      setEquipment(response.data.equipment);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError('Failed to load your equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (equipmentId, newStatus) => {
    try {
      await equipmentAPI.updateStatus(equipmentId, { status: newStatus });
      fetchMyEquipment();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (equipmentId) => {
    try {
      await equipmentAPI.delete(equipmentId);
      setDeleteConfirm(null);
      fetchMyEquipment();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete equipment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show edit form if editing
  if (editingEquipment) {
    return (
      <div className="p-4">
        <button
          onClick={() => setEditingEquipment(null)}
          className="mb-4 text-green-600 hover:underline flex items-center"
        >
          ← Back to My Equipment
        </button>
        <EquipmentUpload
          editData={editingEquipment}
          onSuccess={() => {
            setEditingEquipment(null);
            fetchMyEquipment();
            if (onRefresh) onRefresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Equipment</h2>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="unavailable">Unavailable</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <span className="text-6xl mb-4 block">🚜</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No equipment listed yet</h3>
          <p className="text-gray-500 mb-4">Start sharing your equipment with other farmers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.map((item) => (
            <div key={item._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                <div className="w-full md:w-32 h-32 flex-shrink-0">
                  <img
                    src={item.images?.[0]
                      ? getMediaUrl(item.images[0], 'equipment')
                      : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40">🚜</text></svg>'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-1 font-medium text-green-600">₹{item.pricePerDay}/day</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Views:</span>
                      <span className="ml-1 font-medium">{item.views}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bookings:</span>
                      <span className="ml-1 font-medium">{item.totalBookings}</span>
                    </div>
                    {item.averageRating > 0 && (
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <span className="ml-1 font-medium text-yellow-500">★ {item.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Available: {formatDate(item.availabilityStart)} - {formatDate(item.availabilityEnd)}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditingEquipment(item)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      ✏️ Edit
                    </button>
                    
                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="maintenance">Maintenance</option>
                    </select>

                    <button
                      onClick={() => setDeleteConfirm(item)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Equipment?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEquipment;
