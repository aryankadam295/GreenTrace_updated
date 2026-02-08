import mongoose from 'mongoose';

const equipmentChatSchema = new mongoose.Schema({
  // Participants (owner and renter)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Equipment reference
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  
  // Optional booking reference
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentBooking'
  },
  
  // Messages
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  
  // Last message for preview
  lastMessage: {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
equipmentChatSchema.index({ participants: 1, equipment: 1 });
equipmentChatSchema.index({ 'lastMessage.timestamp': -1 });

// Update updatedAt on save
equipmentChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('EquipmentChat', equipmentChatSchema);
