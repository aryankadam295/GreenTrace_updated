import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
  // Basic Equipment Information
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Tractor', 'Harvester', 'Irrigation', 'Plough', 'Seeder', 'Sprayer', 'Thresher', 'Tools', 'Transport', 'Others']
  },
  description: { type: String, required: true },
  
  // Pricing
  pricePerDay: { type: Number, required: true },
  
  // Location
  location: {
    village: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true }
  },
  
  // Images
  images: [{ type: String }],
  
  // Availability
  availabilityStart: { type: Date, required: true },
  availabilityEnd: { type: Date, required: true },
  
  // Owner Information
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ownerName: { type: String, required: true },
  ownerPhone: { type: String },
  
  // Equipment Status
  status: { 
    type: String, 
    default: 'available',
    enum: ['available', 'rented', 'unavailable', 'maintenance']
  },
  
  // Specifications (optional)
  specifications: {
    brand: { type: String },
    model: { type: String },
    year: { type: Number },
    condition: { 
      type: String, 
      enum: ['Excellent', 'Good', 'Fair', 'Needs Repair'],
      default: 'Good'
    }
  },
  
  // Analytics
  views: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  
  // Ratings
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
equipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
equipmentSchema.index({ ownerId: 1, status: 1 }, { background: true });
equipmentSchema.index({ category: 1, status: 1 }, { background: true });
equipmentSchema.index({ 'location.district': 1, 'location.state': 1 }, { background: true });
equipmentSchema.index({ createdAt: -1 }, { background: true });

export default mongoose.model("Equipment", equipmentSchema);
