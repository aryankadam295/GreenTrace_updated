import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import ReviewForm from './ReviewForm';

const EquipmentDetail = ({ equipmentId, onBack }) => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking form
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  
  // Image gallery
  const [activeImage, setActiveImage] = useState(0);
  
  // Chat
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchEquipment();
    fetchReviews();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      const response = await equipmentAPI.getEquipmentById(equipmentId);
      setEquipment(response.data.equipment);
      setBookedDates(response.data.bookedDates || []);
    } catch (err) {
      setError('Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await equipmentAPI.getEquipmentReviews(equipmentId);
      setReviews(response.data.reviews);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const isDateBooked = (date) => {
    const checkDate = new Date(date);
    return bookedDates.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return checkDate >= start && checkDate <= end;
    });
  };

  const calculatePrice = () => {
    if (!startDate || !endDate) return { days: 0, total: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return { days, total: days * (equipment?.pricePerDay || 0) };
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!startDate || !endDate) {
      setBookingError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setBookingError('End date must be after start date');
      return;
    }

    setBookingLoading(true);

    try {
      await equipmentAPI.createBooking({
        equipmentId,
        startDate,
        endDate,
        message
      });
      setBookingSuccess('Booking request sent successfully! The owner will review your request.');
      setShowBookingForm(false);
      setStartDate('');
      setEndDate('');
      setMessage('');
      fetchEquipment(); // Refresh to update booked dates
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartChat = async () => {
    setChatLoading(true);
    try {
      await equipmentAPI.createEquipmentChat({
        equipmentId,
        message: `Hi, I'm interested in renting your ${equipment.name}.`
      });
      // Navigate to chat tab - this would typically use a callback or state management
      alert('Chat started! Check the Messages tab to continue the conversation.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start chat');
    } finally {
      setChatLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="mb-4 text-green-600 hover:underline flex items-center">
          ← Back to browse
        </button>
        <div className="text-center py-8 text-red-600">{error || 'Equipment not found'}</div>
      </div>
    );
  }

  const isOwner = equipment.ownerId?._id === user?.id || equipment.ownerId === user?.id;
  const { days, total } = calculatePrice();

  return (
    <div className="p-4 md:p-6">
      {/* Back Button */}
      <button onClick={onBack} className="mb-4 text-green-600 hover:underline flex items-center">
        ← Back to browse
      </button>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {bookingSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img
              src={equipment.images?.[activeImage]
                ? `http://localhost:5000/uploads/equipment/${equipment.images[activeImage]}`
                : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40">🚜</text></svg>'
              }
              alt={equipment.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {equipment.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {equipment.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    activeImage === index ? 'border-green-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={`http://localhost:5000/uploads/equipment/${img}`}
                    alt={`${equipment.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mb-2">
                {equipment.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{equipment.name}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              equipment.status === 'available' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {equipment.status}
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-green-600">₹{equipment.pricePerDay}</span>
            <span className="text-gray-500">/day</span>
          </div>

          {/* Rating */}
          {equipment.averageRating > 0 && (
            <div className="flex items-center mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>{i < Math.round(equipment.averageRating) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="ml-2 text-gray-600">
                {equipment.averageRating.toFixed(1)} ({equipment.totalReviews} reviews)
              </span>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{equipment.description}</p>
          </div>

          {/* Specifications */}
          {equipment.specifications && Object.values(equipment.specifications).some(v => v) && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {equipment.specifications.brand && (
                  <div>
                    <span className="text-sm text-gray-500">Brand</span>
                    <p className="font-medium">{equipment.specifications.brand}</p>
                  </div>
                )}
                {equipment.specifications.model && (
                  <div>
                    <span className="text-sm text-gray-500">Model</span>
                    <p className="font-medium">{equipment.specifications.model}</p>
                  </div>
                )}
                {equipment.specifications.year && (
                  <div>
                    <span className="text-sm text-gray-500">Year</span>
                    <p className="font-medium">{equipment.specifications.year}</p>
                  </div>
                )}
                {equipment.specifications.condition && (
                  <div>
                    <span className="text-sm text-gray-500">Condition</span>
                    <p className="font-medium">{equipment.specifications.condition}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
            <p className="text-gray-600">
              Available from {formatDate(equipment.availabilityStart)} to {formatDate(equipment.availabilityEnd)}
            </p>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
            <p className="text-gray-600 flex items-center">
              <span className="mr-2">📍</span>
              {equipment.location?.village}, {equipment.location?.district}, {equipment.location?.state}
            </p>
          </div>

          {/* Owner Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{equipment.ownerName}</p>
                {equipment.ownerPhone && (
                  <p className="text-sm text-gray-500">📞 {equipment.ownerPhone}</p>
                )}
              </div>
              {!isOwner && (
                <button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {chatLoading ? 'Starting...' : '💬 Chat'}
                </button>
              )}
            </div>
          </div>

          {/* Booking Section */}
          {!isOwner && equipment.status === 'available' && (
            <div className="border-t pt-6">
              {!showBookingForm ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Request Booking
                </button>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Book this Equipment</h3>
                  
                  {bookingError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {bookingError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={equipment.availabilityEnd?.split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        max={equipment.availabilityEnd?.split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {days > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>₹{equipment.pricePerDay} × {days} days</span>
                        <span className="font-bold text-green-700">Total: ₹{total}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows="2"
                      placeholder="Add a message for the owner..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {bookingLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {isOwner && (
            <div className="border-t pt-6">
              <p className="text-center text-gray-500 italic">This is your equipment listing</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.reviewerName}</p>
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                
                {(review.equipmentCondition || review.ownerCommunication || review.valueForMoney) && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    {review.equipmentCondition && (
                      <span>Condition: {'★'.repeat(review.equipmentCondition)}</span>
                    )}
                    {review.ownerCommunication && (
                      <span>Communication: {'★'.repeat(review.ownerCommunication)}</span>
                    )}
                    {review.valueForMoney && (
                      <span>Value: {'★'.repeat(review.valueForMoney)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentDetail;
