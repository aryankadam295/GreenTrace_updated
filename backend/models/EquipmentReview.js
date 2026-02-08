import mongoose from "mongoose";

const equipmentReviewSchema = new mongoose.Schema({
  // References
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'EquipmentBooking', 
    required: true,
    unique: true // One review per booking
  },
  equipmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment', 
    required: true 
  },
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Review Content
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: { type: String, required: true },
  
  // Optional detailed ratings
  equipmentCondition: { type: Number, min: 1, max: 5 },
  ownerCommunication: { type: Number, min: 1, max: 5 },
  valueForMoney: { type: Number, min: 1, max: 5 },
  
  // Reviewer Info (cached for display)
  reviewerName: { type: String, required: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
equipmentReviewSchema.index({ equipmentId: 1, createdAt: -1 }, { background: true });
equipmentReviewSchema.index({ reviewerId: 1 }, { background: true });

export default mongoose.model("EquipmentReview", equipmentReviewSchema);
