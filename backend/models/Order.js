import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  farmerName: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  merchantName: { type: String, required: true },
  
  items: [orderItemSchema],
  
  // Order totals
  subtotal: { type: Number, required: true },
  deliveryCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Order status
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  },
  
  // Delivery information
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  // Payment information
  paymentMethod: { 
    type: String, 
    enum: ['cash_on_delivery', 'online_payment', 'bank_transfer'],
    default: 'cash_on_delivery'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Timestamps
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: { type: Date },
  deliveredAt: { type: Date },
  
  // Notes
  orderNotes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate unique order ID before saving
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderId = `ORD-${timestamp.slice(-6)}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
orderSchema.index({ merchantId: 1, status: 1 }, { background: true });
orderSchema.index({ orderId: 1 }, { background: true, unique: true });
orderSchema.index({ orderDate: -1 }, { background: true });

export default mongoose.model("Order", orderSchema);
