import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Common fields
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, required: true, enum: ['farmer', 'merchant', 'admin'] },

  // Farmer-specific fields
  village: { type: String, required: function() { return this.role === 'farmer'; } },
  district: { type: String, required: function() { return this.role === 'farmer'; } },
  state: { type: String, required: function() { return this.role === 'farmer'; } },
  cropsGrown: { type: String }, // Optional field, not required at signup
  landSize: { type: String },

  // Merchant-specific fields
  businessName: { type: String, required: function() { return this.role === 'merchant'; } },
  businessType: { type: String, required: function() { return this.role === 'merchant'; }, enum: ['Retailer', 'Wholesaler'] },
  productsOfInterest: { type: String }, // Optional field, not required at signup
  city: { type: String, required: function() { return this.role === 'merchant'; } },
  merchantState: { type: String, required: function() { return this.role === 'merchant'; } },

  // Common optional fields
  isVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("User", userSchema);
