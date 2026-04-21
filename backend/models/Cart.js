import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { type: Number, required: true, min: 0.001 },
  priceAtTime: { type: Number, required: true }, // Price when added to cart
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.quantity * item.priceAtTime);
  }, 0);
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
cartSchema.index({ merchantId: 1 }, { background: true });

export default mongoose.model("Cart", cartSchema);
