import mongoose from "mongoose";

const equipmentBookingSchema = new mongoose.Schema({
  // Equipment Reference
  equipmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment', 
    required: true 
  },
  
  // Users involved
  renterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Booking Details
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  
  // Booking Status
  status: { 
    type: String, 
    default: 'requested',
    enum: ['requested', 'approved', 'rejected', 'in-use', 'completed', 'cancelled']
  },
  
  // Additional Info
  renterMessage: { type: String }, // Message from renter when requesting
  ownerResponse: { type: String }, // Response from owner
  
  // Status History
  statusHistory: [{
    status: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }],
  
  // Review tracking
  hasReview: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
equipmentBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
equipmentBookingSchema.index({ equipmentId: 1, status: 1 }, { background: true });
equipmentBookingSchema.index({ renterId: 1, status: 1 }, { background: true });
equipmentBookingSchema.index({ ownerId: 1, status: 1 }, { background: true });
equipmentBookingSchema.index({ startDate: 1, endDate: 1 }, { background: true });

export default mongoose.model("EquipmentBooking", equipmentBookingSchema);
