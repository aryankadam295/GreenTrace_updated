import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  // Product Information
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  
  // Farmer Information
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Merchant Information
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  merchantName: { type: String, required: true },
  merchantContact: { type: String, required: true },
  
  // Inquiry Details
  subject: { type: String, required: true },
  message: { type: String, required: true },
  requestedQuantity: { type: Number },
  offeredPrice: { type: Number },
  
  // Status
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'responded', 'accepted', 'rejected', 'closed']
  },
  
  // Response from farmer
  farmerResponse: { type: String },
  responseDate: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
inquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
inquirySchema.index({ farmerId: 1, status: 1 }, { background: true });
inquirySchema.index({ merchantId: 1, status: 1 }, { background: true });
inquirySchema.index({ productId: 1 }, { background: true });

export default mongoose.model("Inquiry", inquirySchema);
