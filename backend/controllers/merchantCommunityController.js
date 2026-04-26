import mongoose from "mongoose";
import User from "../models/User.js";
import MerchantCommunityListing from "../models/MerchantCommunityListing.js";
import MerchantCommunityChat from "../models/MerchantCommunityChat.js";

const ensureMerchant = (req, res) => {
  if (req.user?.role !== "merchant") {
    res.status(403).json({ message: "Only registered merchants can access the community." });
    return false;
  }
  return true;
};

const parsePagination = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const getCommunityMerchants = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const { page, limit, skip } = parsePagination(req);
    const { search = "", businessType = "", state = "", city = "" } = req.query;

    const query = {
      role: "merchant",
      _id: { $ne: req.user._id },
      isSuspended: { $ne: true }
    };

    if (businessType) query.businessType = businessType;
    if (state) query.merchantState = new RegExp(state, "i");
    if (city) query.city = new RegExp(city, "i");
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, "i") },
        { businessName: new RegExp(search, "i") },
        { productsOfInterest: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { merchantState: new RegExp(search, "i") }
      ];
    }

    const [merchants, total] = await Promise.all([
      User.find(query)
        .select("fullName businessName businessType productsOfInterest city merchantState phoneNumber email isVerified createdAt")
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      merchants,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching community merchants:", error);
    res.status(500).json({ message: "Error fetching merchants" });
  }
};

export const getCommunityListings = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const { page, limit, skip } = parsePagination(req);
    const {
      search = "",
      category = "",
      city = "",
      state = "",
      status = "active",
      mine = ""
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (mine === "true") query.merchant = req.user._id;
    if (search) {
      query.$or = [
        { productName: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { preferredTrade: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { state: new RegExp(search, "i") }
      ];
    }

    const [listings, total] = await Promise.all([
      MerchantCommunityListing.find(query)
        .populate("merchant", "fullName businessName businessType city merchantState phoneNumber isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MerchantCommunityListing.countDocuments(query)
    ]);

    res.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching community listings:", error);
    res.status(500).json({ message: "Error fetching community listings" });
  }
};

export const createCommunityListing = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const {
      productName,
      category,
      quantity,
      unit,
      pricePerUnit,
      minOrderQuantity,
      qualityGrade,
      description,
      preferredTrade,
      city,
      state
    } = req.body;

    if (!productName || !category || !quantity || !unit || !pricePerUnit) {
      return res.status(400).json({ message: "Product name, category, quantity, unit, and price are required." });
    }

    const listing = await MerchantCommunityListing.create({
      merchant: req.user._id,
      productName,
      category,
      quantity,
      unit,
      pricePerUnit,
      minOrderQuantity,
      qualityGrade,
      description,
      preferredTrade,
      city: city || req.user.city,
      state: state || req.user.merchantState
    });

    await listing.populate("merchant", "fullName businessName businessType city merchantState phoneNumber isVerified");

    res.status(201).json({ message: "Community listing created successfully", listing });
  } catch (error) {
    console.error("Error creating community listing:", error);
    res.status(500).json({ message: "Error creating community listing" });
  }
};

export const updateCommunityListing = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const listing = await MerchantCommunityListing.findOne({
      _id: req.params.listingId,
      merchant: req.user._id
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const allowedFields = [
      "productName",
      "category",
      "quantity",
      "unit",
      "pricePerUnit",
      "minOrderQuantity",
      "qualityGrade",
      "description",
      "preferredTrade",
      "city",
      "state",
      "status"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });

    await listing.save();
    await listing.populate("merchant", "fullName businessName businessType city merchantState phoneNumber isVerified");

    res.json({ message: "Listing updated successfully", listing });
  } catch (error) {
    console.error("Error updating community listing:", error);
    res.status(500).json({ message: "Error updating community listing" });
  }
};

export const deleteCommunityListing = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const listing = await MerchantCommunityListing.findOneAndDelete({
      _id: req.params.listingId,
      merchant: req.user._id
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting community listing:", error);
    res.status(500).json({ message: "Error deleting community listing" });
  }
};

export const getCommunityChats = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const chats = await MerchantCommunityChat.find({ participants: req.user._id })
      .populate("participants", "fullName businessName businessType city merchantState")
      .populate("listing", "productName category quantity unit pricePerUnit status")
      .populate("lastMessage.sender", "fullName businessName")
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error("Error fetching community chats:", error);
    res.status(500).json({ message: "Error fetching community chats" });
  }
};

export const createCommunityChat = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const { merchantId, listingId, message } = req.body;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ message: "Valid merchantId is required." });
    }

    if (merchantId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot start a community chat with yourself." });
    }

    const recipient = await User.findOne({
      _id: merchantId,
      role: "merchant",
      isSuspended: { $ne: true }
    });

    if (!recipient) {
      return res.status(404).json({ message: "Merchant not found." });
    }

    let listing = null;
    if (listingId) {
      listing = await MerchantCommunityListing.findById(listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found." });
    }

    const chatQuery = {
      participants: { $all: [req.user._id, recipient._id] },
      listing: listing?._id || null
    };

    let chat = await MerchantCommunityChat.findOne(chatQuery);
    const isNewChat = !chat;

    if (!chat) {
      chat = new MerchantCommunityChat({
        participants: [req.user._id, recipient._id],
        listing: listing?._id || null,
        messages: [],
        lastMessage: null
      });
    }

    const initialMessage = message?.trim();
    if (isNewChat && initialMessage) {
      chat.messages.push({
        sender: req.user._id,
        message: initialMessage,
        timestamp: new Date(),
        read: false
      });
      chat.lastMessage = {
        sender: req.user._id,
        message: initialMessage,
        timestamp: new Date()
      };
    }

    await chat.save();
    await chat.populate("participants", "fullName businessName businessType city merchantState");
    await chat.populate("listing", "productName category quantity unit pricePerUnit status");
    await chat.populate("messages.sender", "fullName businessName role");

    res.status(isNewChat ? 201 : 200).json({
      message: isNewChat ? "Community chat started" : "Community chat already exists",
      chat,
      existing: !isNewChat
    });
  } catch (error) {
    console.error("Error creating community chat:", error);
    res.status(500).json({ message: "Error creating community chat" });
  }
};

export const getCommunityChatMessages = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const chat = await MerchantCommunityChat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    })
      .populate("participants", "fullName businessName businessType city merchantState")
      .populate("listing", "productName category quantity unit pricePerUnit status")
      .populate("messages.sender", "fullName businessName role");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.messages.forEach((chatMessage) => {
      if (chatMessage.sender._id.toString() !== req.user._id.toString()) {
        chatMessage.read = true;
      }
    });
    await chat.save();

    res.json({ chat });
  } catch (error) {
    console.error("Error fetching community chat messages:", error);
    res.status(500).json({ message: "Error fetching community chat messages" });
  }
};

export const sendCommunityMessage = async (req, res) => {
  try {
    if (!ensureMerchant(req, res)) return;

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const chat = await MerchantCommunityChat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.messages.push({
      sender: req.user._id,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    });
    chat.lastMessage = {
      sender: req.user._id,
      message: message.trim(),
      timestamp: new Date()
    };

    await chat.save();
    await chat.populate("messages.sender", "fullName businessName role");

    res.json({ message: chat.messages[chat.messages.length - 1] });
  } catch (error) {
    console.error("Error sending community message:", error);
    res.status(500).json({ message: "Error sending community message" });
  }
};
