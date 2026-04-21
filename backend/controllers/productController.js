import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Inquiry from "../models/Inquiry.js";
import { deleteStoredFile, getUploadedFileUrl } from '../utils/storage.js';

// ---------- CREATE PRODUCT ----------
export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      quantity,
      unit,
      price,
      qualityGrade,
      harvestDate,
      description,
      expiryDate
    } = req.body;

    // Get farmer details from authenticated user
    const farmer = await User.findById(req.user.id);
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(403).json({ message: "Access denied. Only farmers can create products." });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => getUploadedFileUrl(file));
    }

    // Create new product
    const newProduct = await Product.create({
      productName,
      category,
      quantity,
      unit,
      price,
      qualityGrade,
      harvestDate,
      description,
      expiryDate,
      images: imageUrls,
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerLocation: {
        village: farmer.village,
        district: farmer.district,
        state: farmer.state
      }
    });

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct
    });
  } catch (error) {
    // Clean up uploaded files if product creation fails
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map((file) => deleteStoredFile(getUploadedFileUrl(file), 'products')));
    }
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET FARMER'S PRODUCTS ----------
export const getFarmerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { farmerId: req.user.id };
    if (status) query.status = status;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE PRODUCT ----------
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the owner or increment views for others
    if (product.farmerId.toString() !== req.user.id) {
      product.views += 1;
      await product.save();
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { farmerId, status = 'listed', limit = 50 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (farmerId) query.farmerId = farmerId;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE PRODUCT ----------
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the owner
    if (product.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only update your own products." });
    }

    // Handle new image uploads
    let imageUrls = product.images || []; // Keep existing images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => getUploadedFileUrl(file));
      imageUrls = [...imageUrls, ...newImageUrls]; // Append new images
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Only update images if new ones were uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = imageUrls;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    // Clean up uploaded files if update fails
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map((file) => deleteStoredFile(getUploadedFileUrl(file), 'products')));
    }
    res.status(500).json({ message: error.message });
  }
};

// ---------- DELETE PRODUCT ----------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the owner
    if (product.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only delete your own products." });
    }

    // Delete associated image files
    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map((imageUrl) => deleteStoredFile(imageUrl, 'products')));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET FARMER DASHBOARD ANALYTICS ----------
export const getFarmerAnalytics = async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get product statistics
    const totalProducts = await Product.countDocuments({ farmerId });
    const listedProducts = await Product.countDocuments({ farmerId, status: 'listed' });
    const soldProducts = await Product.countDocuments({ farmerId, status: 'sold' });
    
    // Get total views and inquiries
    const productStats = await Product.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalInquiries: { $sum: "$inquiries" }
        }
      }
    ]);

    // Get recent inquiries count
    const recentInquiries = await Inquiry.countDocuments({ 
      farmerId, 
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Calculate total revenue (from sold products)
    const revenueStats = await Product.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(farmerId), status: 'sold' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      }
    ]);

    const analytics = {
      totalProducts,
      listedProducts,
      soldProducts,
      totalViews: productStats[0]?.totalViews || 0,
      totalInquiries: productStats[0]?.totalInquiries || 0,
      recentInquiries,
      totalRevenue: revenueStats[0]?.totalRevenue || 0
    };

    res.status(200).json({ analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
