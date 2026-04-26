import mongoose from "mongoose";

const merchantCommunityListingSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ["Grains", "Fruits", "Vegetables", "Pulses", "Dairy", "Spices", "Others"]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ["kg", "quintal", "ton", "pieces", "liters", "bags"]
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 0
  },
  qualityGrade: {
    type: String,
    default: "Standard",
    enum: ["Premium", "Grade A", "Grade B", "Standard"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  preferredTrade: {
    type: String,
    trim: true,
    maxlength: 300
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "reserved", "sold", "closed"]
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

merchantCommunityListingSchema.index({ merchant: 1, status: 1 });
merchantCommunityListingSchema.index({ category: 1, status: 1, createdAt: -1 });
merchantCommunityListingSchema.index({ productName: "text", description: "text", city: "text", state: "text" });

export default mongoose.model("MerchantCommunityListing", merchantCommunityListingSchema);
