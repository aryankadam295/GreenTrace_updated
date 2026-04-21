import express from "express";
import { signupUser, loginUser, logoutUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import EquipmentBooking from "../models/EquipmentBooking.js";
import Product from "../models/Product.js";
import Inquiry from "../models/Inquiry.js";
import Land from "../models/Land.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Access granted to protected route",
    user: req.user
  });
});

// Update UPI ID (farmers only)
router.put("/update-upi", protect, async (req, res) => {
  try {
    const { upiId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "farmer") return res.status(403).json({ message: "Only farmers can set UPI ID" });

    // Basic UPI ID format validation
    const upiRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
    if (upiId && !upiRegex.test(upiId)) {
      return res.status(400).json({ message: "Invalid UPI ID format. Example: name@okicici" });
    }

    user.upiId = upiId || null;
    await user.save();

    res.json({ message: "UPI ID updated successfully", upiId: user.upiId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's UPI ID
router.get("/my-upi", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("upiId fullName");
    res.json({ upiId: user.upiId || null, fullName: user.fullName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/farmers/search", protect, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) return res.json({ farmers: [] });

    const farmers = await User.find({
      role: "farmer",
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { district: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } }
      ]
    })
    .select("_id fullName district state")
    .limit(20);

    res.json({ farmers });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch farmers" });
  }
});

router.get("/recent-activities", protect, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const activities = [];

    try {
      const orders = await Order.find({ farmer: farmerId })
        .sort({ createdAt: -1 }).limit(5)
        .populate("merchant", "fullName").lean();
      for (const o of orders) {
        const isPaid = o.paymentStatus === "paid";
        activities.push({
          type: "order",
          icon: isPaid ? "💰" : "🛒",
          color: isPaid ? "green" : "blue",
          title: isPaid ? `Order #${o._id.toString().slice(-6).toUpperCase()} payment received` : `New order #${o._id.toString().slice(-6).toUpperCase()} placed`,
          subtitle: o.merchant?.fullName ? `By ${o.merchant.fullName} · ₹${o.totalAmount || 0}` : `₹${o.totalAmount || 0}`,
          timestamp: o.updatedAt || o.createdAt,
          badge: isPaid ? "Paid" : o.status || "Pending",
          badgeColor: isPaid ? "green" : "yellow",
        });
      }
    } catch (_) {}

    try {
      const bookings = await EquipmentBooking.find({ owner: farmerId })
        .sort({ createdAt: -1 }).limit(5)
        .populate("renter", "fullName")
        .populate("equipment", "name").lean();
      for (const b of bookings) {
        const isPaid = b.paymentStatus === "paid";
        activities.push({
          type: "equipment_booking",
          icon: isPaid ? "🚜" : "📅",
          color: isPaid ? "blue" : "yellow",
          title: isPaid ? `Equipment rental payment received` : `New booking request for ${b.equipment?.name || "equipment"}`,
          subtitle: b.renter?.fullName ? `By ${b.renter.fullName} · ${b.totalDays || 1} day(s)` : `${b.totalDays || 1} day(s)`,
          timestamp: b.updatedAt || b.createdAt,
          badge: b.status || "Pending",
          badgeColor: b.status === "approved" || isPaid ? "green" : b.status === "rejected" ? "red" : "yellow",
        });
      }
    } catch (_) {}

    try {
      const products = await Product.find({ farmer: farmerId })
        .sort({ createdAt: -1 }).limit(4).lean();
      for (const p of products) {
        activities.push({
          type: "product",
          icon: "📦",
          color: "purple",
          title: `Product "${p.productName}" uploaded`,
          subtitle: `${p.category} · ₹${p.price}/${p.unit} · ${p.quantity} ${p.unit}`,
          timestamp: p.createdAt,
          badge: p.status === "listed" ? "Listed" : p.status,
          badgeColor: p.status === "listed" ? "green" : "gray",
        });
      }
    } catch (_) {}

    try {
      const inquiries = await Inquiry.find({ farmer: farmerId })
        .sort({ createdAt: -1 }).limit(4)
        .populate("merchant", "fullName")
        .populate("product", "productName").lean();
      for (const i of inquiries) {
        activities.push({
          type: "inquiry",
          icon: "💬",
          color: "indigo",
          title: `New inquiry on "${i.product?.productName || "product"}"`,
          subtitle: i.merchant?.fullName ? `From ${i.merchant.fullName}` : "From a merchant",
          timestamp: i.createdAt,
          badge: i.status || "New",
          badgeColor: i.status === "responded" ? "green" : "indigo",
        });
      }
    } catch (_) {}

    try {
      const lands = await Land.find({ owner: farmerId })
        .sort({ createdAt: -1 }).limit(3).lean();
      for (const l of lands) {
        activities.push({
          type: "land",
          icon: "🏞️",
          color: "teal",
          title: `Land listed: ${l.title || l.location || "New land"}`,
          subtitle: `${l.area || ""} ${l.areaUnit || "acres"} · ₹${l.pricePerMonth || l.price || 0}/month`,
          timestamp: l.createdAt,
          badge: l.status || "Active",
          badgeColor: l.status === "rented" ? "blue" : "green",
        });
      }
    } catch (_) {}

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ activities: activities.slice(0, 12) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;