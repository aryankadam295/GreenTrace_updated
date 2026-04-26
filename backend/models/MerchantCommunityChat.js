import mongoose from "mongoose";

const merchantCommunityChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MerchantCommunityListing",
    default: null
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  lastMessage: {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

merchantCommunityChatSchema.index({ participants: 1, listing: 1 });
merchantCommunityChatSchema.index({ "lastMessage.timestamp": -1 });

export default mongoose.model("MerchantCommunityChat", merchantCommunityChatSchema);
