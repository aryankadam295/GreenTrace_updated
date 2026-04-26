import mongoose from "mongoose";

const productQualityReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  verifiedQualityGrade: {
    type: String,
    required: true,
    enum: ["Premium", "Grade A", "Grade B", "Standard"]
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  merchantName: {
    type: String,
    required: true
  },
  farmerName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

productQualityReviewSchema.index(
  { productId: 1, orderId: 1, merchantId: 1 },
  { unique: true, background: true }
);
productQualityReviewSchema.index({ productId: 1, createdAt: -1 }, { background: true });
productQualityReviewSchema.index({ farmerId: 1, createdAt: -1 }, { background: true });

export default mongoose.model("ProductQualityReview", productQualityReviewSchema);
