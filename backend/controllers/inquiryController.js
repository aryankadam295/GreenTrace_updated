import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// ---------- CREATE INQUIRY (Merchant to Farmer) ----------
export const createInquiry = async (req, res) => {
  try {
    const {
      productId,
      subject,
      message,
      requestedQuantity,
      offeredPrice
    } = req.body;

    // Get merchant details
    const merchant = await User.findById(req.user.id);
    if (!merchant || merchant.role !== 'merchant') {
      return res.status(403).json({ message: "Access denied. Only merchants can create inquiries." });
    }

    // Get product and farmer details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create new inquiry
    const newInquiry = await Inquiry.create({
      productId,
      farmerId: product.farmerId,
      merchantId: merchant._id,
      merchantName: merchant.fullName,
      merchantContact: merchant.phoneNumber,
      subject,
      message,
      requestedQuantity,
      offeredPrice
    });

    // Increment inquiry count for the product
    product.inquiries += 1;
    await product.save();

    res.status(201).json({
      message: "Inquiry sent successfully",
      inquiry: newInquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET FARMER'S INQUIRIES ----------
export const getFarmerInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { farmerId: req.user.id };
    if (status) query.status = status;

    const inquiries = await Inquiry.find(query)
      .populate('productId', 'productName category price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Inquiry.countDocuments(query);

    res.status(200).json({
      inquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET MERCHANT'S INQUIRIES ----------
export const getMerchantInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { merchantId: req.user.id };
    if (status) query.status = status;

    const inquiries = await Inquiry.find(query)
      .populate('productId', 'productName category price farmerName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Inquiry.countDocuments(query);

    res.status(200).json({
      inquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- RESPOND TO INQUIRY (Farmer Response) ----------
export const respondToInquiry = async (req, res) => {
  try {
    const { farmerResponse, status } = req.body;
    
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Check if user is the farmer who owns the product
    if (inquiry.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only respond to inquiries for your products." });
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        farmerResponse,
        status: status || 'responded',
        responseDate: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('productId', 'productName category');

    res.status(200).json({
      message: "Response sent successfully",
      inquiry: updatedInquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE INQUIRY ----------
export const getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('productId', 'productName category price quantity unit')
      .populate('farmerId', 'fullName phoneNumber village district state')
      .populate('merchantId', 'fullName phoneNumber businessName city');

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Check if user is either the farmer or merchant involved
    if (inquiry.farmerId._id.toString() !== req.user.id && 
        inquiry.merchantId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({ inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE INQUIRY STATUS ----------
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Check if user is either the farmer or merchant involved
    if (inquiry.farmerId.toString() !== req.user.id && 
        inquiry.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      message: "Inquiry status updated successfully",
      inquiry: updatedInquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
