import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Inquiry from "../models/Inquiry.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";

// ---------- DASHBOARD ANALYTICS ----------
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    
    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get transaction data (using orders as proxy for transactions)
    const totalTransactions = await Order.countDocuments();
    const completedTransactions = await Order.countDocuments({ status: 'delivered' });

    // Calculate revenue and commission
    const revenueStats = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCommission: { $sum: { $multiply: ["$totalAmount", 0.05] } } // 5% commission
        }
      }
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalCommission = revenueStats[0]?.totalCommission || 0;

    // Get revenue trend data (last 30 days)
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 15 }
    ]);

    const analytics = {
      totalUsers,
      totalFarmers,
      totalMerchants,
      newUsersThisMonth,
      activeUsers: activeUsers || Math.floor(totalUsers * 0.7), // Fallback estimate
      totalTransactions,
      completedTransactions,
      totalRevenue,
      totalCommission,
      revenueData
    };

    res.status(200).json({ analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- USER MANAGEMENT ----------
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;

    // Build query
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Add activity count for each user
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        let activities = 0;
        
        if (user.role === 'farmer') {
          const productCount = await Product.countDocuments({ farmerId: user._id });
          const inquiryCount = await Inquiry.countDocuments({ farmerId: user._id });
          activities = productCount + inquiryCount;
        } else if (user.role === 'merchant') {
          const orderCount = await Order.countDocuments({ merchantId: user._id });
          const inquiryCount = await Inquiry.countDocuments({ merchantId: user._id });
          activities = orderCount + inquiryCount;
        }

        return {
          ...user.toObject(),
          activities,
          status: user.isSuspended ? 'Suspended' : 'Active',
          isSuspended: user.isSuspended || false,
          suspendReason: user.suspendReason || null
        };
      })
    );

    res.status(200).json({
      users: usersWithActivity,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- TOP PERFORMERS ----------
export const getTopPerformers = async (req, res) => {
  try {
    // Top farmers by sales
    const topFarmers = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.farmerId",
          totalSales: { $sum: "$items.totalPrice" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "farmer"
        }
      },
      { $unwind: "$farmer" },
      {
        $project: {
          name: "$farmer.fullName",
          username: "$farmer.email",
          sales: "$totalSales",
          orders: "$orderCount",
          rating: 4.5 // Placeholder
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    // Top merchants by purchases
    const topMerchants = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: "$merchantId",
          totalPurchases: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "merchant"
        }
      },
      { $unwind: "$merchant" },
      {
        $project: {
          name: "$merchant.businessName",
          username: "$merchant.email",
          purchases: "$totalPurchases",
          orders: "$orderCount",
          rating: 4.6 // Placeholder
        }
      },
      { $sort: { purchases: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({ topFarmers, topMerchants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- RECENT ACTIVITIES ----------
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent products
    const recentProducts = await Product.find()
      .populate('farmerId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('merchantId', 'fullName businessName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent inquiries
    const recentInquiries = await Inquiry.find()
      .populate('merchantId', 'fullName businessName email')
      .populate('farmerId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Format activities
    const activities = [];

    recentProducts.forEach(product => {
      activities.push({
        id: product._id,
        user: product.farmerId?.email || 'unknown',
        type: 'PRODUCT_ADD',
        description: `Added new product: ${product.productName}`,
        time: getTimeAgo(product.createdAt),
        icon: '📦'
      });
    });

    recentOrders.forEach(order => {
      activities.push({
        id: order._id,
        user: order.merchantId?.email || 'unknown',
        type: 'ORDER_PLACED',
        description: `Placed order #${order.orderId}`,
        time: getTimeAgo(order.createdAt),
        icon: '🛒'
      });
    });

    recentInquiries.forEach(inquiry => {
      activities.push({
        id: inquiry._id,
        user: inquiry.merchantId?.email || 'unknown',
        type: 'INQUIRY_SENT',
        description: `Sent inquiry about ${inquiry.subject}`,
        time: getTimeAgo(inquiry.createdAt),
        icon: '💬'
      });
    });

    // Sort by time and limit
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.status(200).json({ activities: limitedActivities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- RECENT TRANSACTIONS ----------
export const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await Order.find()
      .populate('merchantId', 'fullName businessName email')
      .populate('items.farmerId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const formattedTransactions = transactions.map(order => ({
      id: order.orderId,
      buyer: order.merchantId?.email || 'unknown',
      seller: order.items[0]?.farmerId?.email || 'unknown',
      amount: order.totalAmount,
      commission: order.totalAmount * 0.05, // 5% commission
      status: order.status.toUpperCase(),
      date: getTimeAgo(order.createdAt)
    }));

    res.status(200).json({ transactions: formattedTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ACTIVITY DISTRIBUTION ----------
export const getActivityDistribution = async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const inquiryCount = await Inquiry.countDocuments();
    const cartCount = await Cart.countDocuments();
    
    // Simulate login count (would need to track this in real app)
    const loginCount = Math.floor(productCount * 2.5);

    const activityData = [
      { name: 'Product Added', value: productCount, color: '#10b981' },
      { name: 'Orders Placed', value: orderCount, color: '#3b82f6' },
      { name: 'User Logins', value: loginCount, color: '#8b5cf6' },
      { name: 'Inquiries', value: inquiryCount, color: '#f59e0b' },
      { name: 'Cart Actions', value: cartCount, color: '#ec4899' }
    ];

    res.status(200).json({ activityData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} mins ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};
export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
 
    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
 
    // Fetch role-specific stats
    let stats = {};
    if (user.role === "farmer") {
      const [productCount, inquiryCount] = await Promise.all([
        Product.countDocuments({ farmerId: userId }),
        Inquiry.countDocuments({ farmerId: userId }),
      ]);
      const orders = await Order.find({ "items.farmerId": userId, paymentStatus: "paid" }).lean();
      const totalRevenue = orders.reduce((sum, o) => {
        const farmerItems = o.items.filter((i) => String(i.farmerId) === String(userId));
        return sum + farmerItems.reduce((s, i) => s + (i.totalPrice || 0), 0);
      }, 0);
      stats = { productCount, inquiryCount, totalRevenue, orderCount: orders.length };
    } else if (user.role === "merchant") {
      const [orderCount, inquiryCount] = await Promise.all([
        Order.countDocuments({ merchantId: userId }),
        Inquiry.countDocuments({ merchantId: userId }),
      ]);
      const totalSpent = await Order.aggregate([
        { $match: { merchantId: new mongoose.Types.ObjectId(userId), paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      stats = { orderCount, inquiryCount, totalSpent: totalSpent[0]?.total || 0 };
    }
 
    res.json({ user, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// ---------- EDIT USER ----------
export const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, isVerified } = req.body;
 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
 
    // Only allow safe fields to be updated by admin
    if (fullName)   user.fullName   = fullName.trim();
    if (email)      user.email      = email.trim().toLowerCase();
    if (phoneNumber)user.phoneNumber= phoneNumber.trim();
    if (typeof isVerified === "boolean") user.isVerified = isVerified;
 
    await user.save();
    const updated = await User.findById(userId).select("-password");
    res.json({ message: "User updated successfully", user: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use by another account." });
    }
    res.status(500).json({ message: error.message });
  }
};
 
// ---------- SUSPEND / UNSUSPEND USER ----------
export const toggleSuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot suspend an admin account." });
 
    const willBeSuspended = !user.isSuspended;
    user.isSuspended   = willBeSuspended;
    user.suspendedAt   = willBeSuspended ? new Date() : null;
    user.suspendReason = willBeSuspended ? (reason || "Suspended by admin") : null;
 
    await user.save();
 
    res.json({
      message: willBeSuspended
        ? `User ${user.fullName} has been suspended.`
        : `User ${user.fullName} has been reinstated.`,
      isSuspended: user.isSuspended,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 