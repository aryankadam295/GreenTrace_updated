import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  addedAt: { type: Date, default: Date.now }
});

const wishlistSchema = new mongoose.Schema({
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [wishlistItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
wishlistSchema.index({ merchantId: 1 }, { background: true });

export default mongoose.model("Wishlist", wishlistSchema);
