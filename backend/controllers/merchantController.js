import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Order from "../models/Order.js";
import Inquiry from "../models/Inquiry.js";

// ---------- BROWSE PRODUCTS ----------
export const browseProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      location,
      qualityGrade,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { status: 'listed' };
    
    if (category) query.category = category;
    if (qualityGrade) query.qualityGrade = qualityGrade;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (location) {
      query.$or = [
        { 'farmerLocation.village': new RegExp(location, 'i') },
        { 'farmerLocation.district': new RegExp(location, 'i') },
        { 'farmerLocation.state': new RegExp(location, 'i') }
      ];
    }
    if (search) {
      query.$or = [
        { productName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { farmerName: new RegExp(search, 'i') }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('farmerId', 'fullName phoneNumber village district state');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasMore: page < Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET MERCHANT ANALYTICS ----------
export const getMerchantAnalytics = async (req, res) => {
  try {
    const merchantId = req.user.id;

    // Get cart items count
    const cart = await Cart.findOne({ merchantId });
    const cartItemsCount = cart ? cart.items.length : 0;

    // Get wishlist items count
    const wishlist = await Wishlist.findOne({ merchantId });
    const wishlistItemsCount = wishlist ? wishlist.items.length : 0;

    // Get orders statistics
    const totalOrders = await Order.countDocuments({ merchantId });
    const pendingOrders = await Order.countDocuments({ merchantId, status: 'pending' });
    const completedOrders = await Order.countDocuments({ merchantId, status: 'delivered' });

    // Get total spent
    const spentStats = await Order.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantId), status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Get recent inquiries count
    const recentInquiries = await Inquiry.countDocuments({ 
      merchantId, 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Get favorite categories
    const favoriteCategories = await Order.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          count: { $sum: 1 },
          totalSpent: { $sum: "$items.totalPrice" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const analytics = {
      cartItemsCount,
      wishlistItemsCount,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSpent: spentStats[0]?.totalSpent || 0,
      recentInquiries,
      favoriteCategories
    };

    res.status(200).json({ analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET PRODUCT CATEGORIES ----------
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'listed' } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET FARMER PROFILE ----------
export const getFarmerProfile = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const farmer = await User.findById(farmerId).select('-password');
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({ message: "Farmer not found" });
    }

    // Get farmer's products
    const products = await Product.find({ 
      farmerId, 
      status: 'listed' 
    }).limit(10);

    // Get farmer statistics
    const totalProducts = await Product.countDocuments({ farmerId });
    const totalSold = await Product.countDocuments({ farmerId, status: 'sold' });
    
    const avgRating = 4.5; // Placeholder for rating system
    const totalReviews = 25; // Placeholder for review system

    const farmerProfile = {
      farmer,
      products,
      stats: {
        totalProducts,
        totalSold,
        avgRating,
        totalReviews,
        joinedDate: farmer.createdAt
      }
    };

    res.status(200).json({ farmerProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- SEARCH SUGGESTIONS ----------
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    const suggestions = await Product.aggregate([
      {
        $match: {
          status: 'listed',
          $or: [
            { productName: new RegExp(query, 'i') },
            { category: new RegExp(query, 'i') },
            { farmerName: new RegExp(query, 'i') }
          ]
        }
      },
      {
        $group: {
          _id: null,
          productNames: { $addToSet: "$productName" },
          categories: { $addToSet: "$category" },
          farmerNames: { $addToSet: "$farmerName" }
        }
      },
      {
        $project: {
          suggestions: {
            $slice: [
              {
                $setUnion: [
                  { $filter: { input: "$productNames", cond: { $regexMatch: { input: "$$this", regex: query, options: "i" } } } },
                  { $filter: { input: "$categories", cond: { $regexMatch: { input: "$$this", regex: query, options: "i" } } } },
                  { $filter: { input: "$farmerNames", cond: { $regexMatch: { input: "$$this", regex: query, options: "i" } } } }
                ]
              },
              10
            ]
          }
        }
      }
    ]);

    const result = suggestions[0]?.suggestions || [];
    res.status(200).json({ suggestions: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
