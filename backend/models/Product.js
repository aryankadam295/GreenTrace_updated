import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  // Basic Product Information
  productName: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Grains', 'Fruits', 'Vegetables', 'Pulses', 'Dairy', 'Spices', 'Others']
  },
  quantity: { type: Number, required: true },
  unit: { 
    type: String, 
    required: true,
    enum: ['kg', 'quintal', 'ton', 'pieces', 'liters', 'bags']
  },
  price: { type: Number, required: true }, // Price per unit
  
  // Quality and Details
  qualityGrade: { 
    type: String, 
    required: true,
    enum: ['Premium', 'Grade A', 'Grade B', 'Standard']
  },
  harvestDate: { type: Date, required: true },
  description: { type: String },
  
  // Images
  images: [{ type: String }], // Array of image URLs/paths
  
  // Farmer Information
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  farmerName: { type: String, required: true },
  farmerLocation: {
    village: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true }
  },
  
  // Product Status
  status: { 
    type: String, 
    default: 'listed',
    enum: ['listed', 'under_review', 'sold', 'expired', 'removed']
  },
  
  // Analytics
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date } // Optional expiry for perishable items
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
productSchema.index({ farmerId: 1, status: 1 }, { background: true });
productSchema.index({ category: 1, status: 1 }, { background: true });
productSchema.index({ createdAt: -1 }, { background: true });

export default mongoose.model("Product", productSchema);
