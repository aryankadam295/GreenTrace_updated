import React, { useState } from 'react';
import { equipmentAPI } from '../../../utils/api';

const ReviewForm = ({ booking, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState(0);
  const [ownerCommunication, setOwnerCommunication] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select an overall rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review comment must be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      await equipmentAPI.createReview({
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
        equipmentCondition: equipmentCondition || undefined,
        ownerCommunication: ownerCommunication || undefined,
        valueForMoney: valueForMoney || undefined
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, onHover, size = 'lg' }) => {
    const sizeClasses = {
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-3xl'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onHover && onHover(0)}
            className={`${sizeClasses[size]} transition-colors focus:outline-none`}
          >
            <span className={
              star <= (onHover ? (hoverRating || value) : value)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  const MiniStarRating = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? 0 : star)}
            className="text-lg transition-colors focus:outline-none"
          >
            <span className={star <= value ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          ⭐ Review Your Rental Experience
        </h2>

        {/* Equipment Info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
            <img
              src={booking.equipmentId?.images?.[0]
                ? `http://localhost:5000/uploads/equipment/${booking.equipmentId.images[0]}`
                : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="30">🚜</text></svg>'
              }
              alt={booking.equipmentId?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{booking.equipmentId?.name}</h3>
            <p className="text-sm text-gray-500">{booking.equipmentId?.category}</p>
            <p className="text-sm text-gray-500">
              Rented: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-4">
              <StarRating
                value={rating}
                onChange={setRating}
                onHover={setHoverRating}
              />
              <span className="text-gray-500">
                {rating > 0 && (
                  <span className="font-medium text-gray-700">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              placeholder="Share your experience with this equipment. How was the condition? Was it easy to use? Would you recommend it to others?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Detailed Ratings (Optional) */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Rate specific aspects (optional)
            </p>
            <div className="space-y-1 bg-gray-50 rounded-lg p-4">
              <MiniStarRating
                label="Equipment Condition"
                value={equipmentCondition}
                onChange={setEquipmentCondition}
              />
              <MiniStarRating
                label="Owner Communication"
                value={ownerCommunication}
                onChange={setOwnerCommunication}
              />
              <MiniStarRating
                label="Value for Money"
                value={valueForMoney}
                onChange={setValueForMoney}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || rating === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading || rating === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Review Guidelines */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        <h4 className="font-medium mb-2">📝 Review Guidelines</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Be honest and constructive in your feedback</li>
          <li>Describe the equipment's actual condition during your rental</li>
          <li>Mention if the equipment met your expectations</li>
          <li>Your review helps other farmers make informed decisions</li>
        </ul>
      </div>
    </div>
  );
};

export default ReviewForm;
