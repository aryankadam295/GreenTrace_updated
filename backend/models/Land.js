import mongoose from "mongoose";

const landSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  area: { type: String, required: true }, // e.g., '10 acres', '2000 sqft'
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  rentPrice: { type: Number, required: true },
  rentDuration: { type: String, enum: ['monthly', 'yearly'], default: 'yearly', required: true },
  landImage: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Verification Fields
  documents: [{
    type: { type: String, enum: ['7/12', 'Aadhaar', 'Tax'], required: true },
    url: { type: String, required: true }
  }],
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  selfDeclaration: { type: Boolean, required: true, validate: [val => val === true, 'Self declaration is required'] },
  
  // Community Reporting
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  reportCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

landSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.reportCount = this.reports.length;
  next();
});

export default mongoose.model("Land", landSchema);
