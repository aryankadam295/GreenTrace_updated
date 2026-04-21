import express from "express";
import crypto from "crypto";
import { protect } from "../middleware/authMiddleware.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Equipment from "../models/Equipment.js";           // ✅ NEW
import EquipmentBooking from "../models/EquipmentBooking.js"; // ✅ NEW

const router = express.Router();
router.use(protect);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const buildOrderId = () =>
  `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const buildBookingId = () =>
  `BKG-${Date.now().toString().slice(-6)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const merchantOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "merchant")
      return res.status(403).json({ message: "Only merchants can perform this action" });
    req.merchant = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const farmerOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "farmer")
      return res.status(403).json({ message: "Only farmers can perform this action" });
    req.farmer = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Any logged-in user can rent equipment (farmer or merchant)
const anyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// PRODUCT PAYMENT ROUTES (unchanged)
// ─────────────────────────────────────────────

// STEP 1: Merchant initiates UPI payment for product cart
router.post("/initiate-upi-payment", merchantOnly, async (req, res) => {
  try {
    const cart = await Cart.findOne({ merchantId: req.user.id }).populate({
      path: "items.productId",
      select: "productName unit farmerId farmerName quantity status",
    });

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty." });

    const validItems = cart.items.filter(
      (item) => item.productId && item.productId.status === "listed" && item.quantity > 0
    );

    if (validItems.length === 0)
      return res.status(400).json({ message: "No valid items in cart." });

    const subtotal = validItems.reduce(
      (sum, item) => sum + item.quantity * item.priceAtTime, 0
    );

    const farmerIds = [...new Set(validItems.map((i) => String(i.productId.farmerId)))];
    const farmers = await User.find({ _id: { $in: farmerIds } }).select("_id fullName upiId");

// ✅ Block order if ANY farmer has no UPI ID
const farmersWithoutUpi = farmers.filter(f => !f.upiId);
if (farmersWithoutUpi.length > 0) {
  const names = farmersWithoutUpi.map(f => f.fullName).join(", ");
  return res.status(400).json({
    message: `Cannot place order. The following farmer(s) have not set up their UPI ID: ${names}. Please contact them or try again later.`,
    farmersWithoutUpi: farmersWithoutUpi.map(f => ({ id: f._id, name: f.fullName })),
  });
}

const farmerPayments = farmers.map((farmer) => {
  const farmerItems = validItems.filter(
    (item) => String(item.productId.farmerId) === String(farmer._id)
  );
  const amount = farmerItems.reduce((sum, item) => sum + item.quantity * item.priceAtTime, 0);
  return {
    farmerId: farmer._id,
    farmerName: farmer.fullName,
    upiId: farmer.upiId,   // guaranteed non-null now
    amount,
    items: farmerItems.map((item) => ({
      productName: item.productId.productName,
      quantity: item.quantity,
      pricePerUnit: item.priceAtTime,
      total: item.quantity * item.priceAtTime,
    })),
  };
});

    const orderItems = validItems.map((item) => ({
      productId: item.productId._id,
      productName: item.productId.productName,
      quantity: item.quantity,
      pricePerUnit: item.priceAtTime,
      totalPrice: item.quantity * item.priceAtTime,
      farmerId: item.productId.farmerId,
      farmerName: item.productId.farmerName,
    }));

    const newOrder = await Order.create({
      orderId: buildOrderId(),
      merchantId: req.user.id,
      merchantName: req.merchant.fullName,
      items: orderItems,
      subtotal,
      totalAmount: subtotal,
      deliveryAddress: {
        street: req.merchant.businessName || "Business Location",
        city: req.merchant.city || "NA",
        state: req.merchant.merchantState || "NA",
        pincode: "000000",
        phone: req.merchant.phoneNumber,
      },
      paymentMethod: "upi",
      paymentStatus: "pending",
      paymentGateway: "upi_direct",
    });

    res.json({
      orderId: newOrder.orderId,
      orderDbId: newOrder._id,
      subtotal,
      farmerPayments,
    });
  } catch (error) {
    console.error("UPI initiate error:", error);
    res.status(500).json({ message: error.message });
  }
});

// STEP 2: Merchant confirms product payment
router.post("/confirm-upi-payment", merchantOnly, async (req, res) => {
  try {
    const { orderDbId, upiTransactionIds } = req.body;

    const order = await Order.findOne({ _id: orderDbId, merchantId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.paymentStatus === "paid")
      return res.status(400).json({ message: "Order already confirmed." });

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paidAt = new Date();
    order.upiTransactionIds = upiTransactionIds || [];
    await order.save();

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      product.quantity = Math.max(product.quantity - item.quantity, 0);
      if (product.quantity === 0) product.status = "sold";
      await product.save();
    }

    await Cart.findOneAndUpdate(
      { merchantId: req.user.id },
      { items: [], totalAmount: 0 }
    );

    res.json({ message: "Payment confirmed successfully!", orderId: order.orderId });
  } catch (error) {
    console.error("UPI confirm error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET merchant product orders
router.get("/merchant-orders", merchantOnly, async (req, res) => {
  try {
    const orders = await Order.find({ merchantId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET farmer product transactions
router.get("/farmer-transactions", farmerOnly, async (req, res) => {
  try {
    const farmerId = String(req.user.id);
    const orders = await Order.find({
      paymentStatus: "paid",
      "items.farmerId": req.user.id,
    })
      .sort({ paidAt: -1 })
      .limit(30)
      .lean();

    const transactions = orders.map((order) => {
      const farmerItems = order.items.filter((item) => String(item.farmerId) === farmerId);
      const receivedAmount = farmerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      return {
        orderId: order.orderId,
        merchantName: order.merchantName,
        receivedAmount,
        itemsCount: farmerItems.length,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt || order.updatedAt,
      };
    });

    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// EQUIPMENT RENTAL PAYMENT ROUTES ✅ NEW
// ─────────────────────────────────────────────

/**
 * STEP 1: Renter initiates UPI payment for an approved equipment booking
 * The booking must already be approved by the owner before payment
 * POST /payments/initiate-equipment-payment
 * Body: { bookingId }
 */
router.post("/initiate-equipment-payment", anyUser, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId)
      return res.status(400).json({ message: "bookingId is required." });

    // Find the booking and populate equipment + owner details
    const booking = await EquipmentBooking.findById(bookingId)
      .populate("equipmentId", "name category pricePerDay")
      .populate("ownerId", "_id fullName upiId phoneNumber");

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // Only the renter can pay
    if (String(booking.renterId) !== String(req.user.id))
      return res.status(403).json({ message: "Only the renter can initiate payment." });

    // Booking must be approved before payment
    if (booking.status !== "approved")
      return res.status(400).json({
        message: `Booking must be approved before payment. Current status: ${booking.status}`
      });

    // Already paid
    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "This booking is already paid." });

    const owner = booking.ownerId;

    if (!owner.upiId) {
       return res.status(400).json({
    message: `Cannot proceed with payment. The equipment owner (${owner.fullName}) has not set up their UPI ID yet. Please contact them directly.`,
    ownerName: owner.fullName,
  });
}


    // Assign a bookingId reference if not already set
    if (!booking.bookingId) {
      booking.bookingId = buildBookingId();
      await booking.save();
    }

    res.json({
      bookingDbId: booking._id,
      bookingId: booking.bookingId,
      equipment: {
        name: booking.equipmentId?.name || "Equipment",
        category: booking.equipmentId?.category || "",
        pricePerDay: booking.pricePerDay,
      },
      rentalDetails: {
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalDays: booking.totalDays,
        totalPrice: booking.totalPrice,
      },
      ownerPayment: {
        ownerId: owner._id,
        ownerName: owner.fullName,
        upiId: owner.upiId || null,      // null = owner hasn't set UPI yet
        amount: booking.totalPrice,
      },
    });
  } catch (error) {
    console.error("Equipment UPI initiate error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * STEP 2: Renter confirms they have paid via UPI
 * POST /payments/confirm-equipment-payment
 * Body: { bookingDbId, upiTransactionId }
 */
router.post("/confirm-equipment-payment", anyUser, async (req, res) => {
  try {
    const { bookingDbId, upiTransactionId } = req.body;

    if (!bookingDbId)
      return res.status(400).json({ message: "bookingDbId is required." });

    const booking = await EquipmentBooking.findById(bookingDbId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // Only the renter can confirm
    if (String(booking.renterId) !== String(req.user.id))
      return res.status(403).json({ message: "Only the renter can confirm payment." });

    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Booking already marked as paid." });

    // Mark payment as done
    booking.paymentStatus = "paid";
    booking.paymentMethod = "upi";
    booking.upiTransactionId = upiTransactionId || null;
    booking.paidAt = new Date();

    // Move booking status to in-use (payment done = rental active)
    booking.status = "in-use";
    booking.statusHistory.push({
      status: "in-use",
      changedAt: new Date(),
      changedBy: req.user.id,
      note: `UPI payment confirmed. Txn ID: ${upiTransactionId || "not provided"}`,
    });

    await booking.save();

    // Mark equipment as rented
    await Equipment.findByIdAndUpdate(booking.equipmentId, { status: "rented" });

    res.json({
      message: "Equipment rental payment confirmed!",
      bookingId: booking.bookingId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    console.error("Equipment UPI confirm error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET renter's equipment bookings with payment info
 * GET /payments/my-equipment-bookings
 */
router.get("/my-equipment-bookings", anyUser, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({ renterId: req.user.id })
      .populate("equipmentId", "name category images location")
      .populate("ownerId", "fullName phoneNumber")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET equipment owner's rental income transactions
 * GET /payments/equipment-rental-income
 */
router.get("/equipment-rental-income", farmerOnly, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({
      ownerId: req.user.id,
      paymentStatus: "paid",
    })
      .populate("equipmentId", "name category")
      .populate("renterId", "fullName phoneNumber")
      .sort({ paidAt: -1 })
      .limit(30)
      .lean();

    const totalIncome = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const transactions = bookings.map((b) => ({
      bookingId: b.bookingId || b._id,
      equipmentName: b.equipmentId?.name || "Equipment",
      renterName: b.renterId?.fullName || "Unknown",
      totalDays: b.totalDays,
      pricePerDay: b.pricePerDay,
      receivedAmount: b.totalPrice,
      upiTransactionId: b.upiTransactionId,
      paymentStatus: b.paymentStatus,
      paidAt: b.paidAt,
    }));

    res.status(200).json({ transactions, totalIncome });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;