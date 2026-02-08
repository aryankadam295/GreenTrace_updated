import EquipmentReview from "../models/EquipmentReview.js";
import EquipmentBooking from "../models/EquipmentBooking.js";
import Equipment from "../models/Equipment.js";
import User from "../models/User.js";

// ---------- CREATE REVIEW ----------
export const createReview = async (req, res) => {
  try {
    const { 
      bookingId, 
      rating, 
      comment,
      equipmentCondition,
      ownerCommunication,
      valueForMoney
    } = req.body;
    const reviewerId = req.user.id;

    // Get the booking
    const booking = await EquipmentBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify the reviewer is the renter
    if (booking.renterId.toString() !== reviewerId) {
      return res.status(403).json({ message: "Only the renter can leave a review" });
    }

    // Verify booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: "Can only review completed bookings" });
    }

    // Check if review already exists
    if (booking.hasReview) {
      return res.status(400).json({ message: "You have already reviewed this booking" });
    }

    // Get reviewer name
    const reviewer = await User.findById(reviewerId);

    // Create review
    const newReview = await EquipmentReview.create({
      bookingId,
      equipmentId: booking.equipmentId,
      reviewerId,
      rating,
      comment,
      equipmentCondition,
      ownerCommunication,
      valueForMoney,
      reviewerName: reviewer.fullName
    });

    // Update booking to mark as reviewed
    booking.hasReview = true;
    await booking.save();

    // Update equipment average rating
    const reviews = await EquipmentReview.find({ equipmentId: booking.equipmentId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Equipment.findByIdAndUpdate(booking.equipmentId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review: newReview
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this booking" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET EQUIPMENT REVIEWS ----------
export const getEquipmentReviews = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await EquipmentReview.find({ equipmentId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewerId', 'fullName');

    const total = await EquipmentReview.countDocuments({ equipmentId });

    // Calculate rating distribution
    const ratingDistribution = await EquipmentReview.aggregate([
      { $match: { equipmentId: equipmentId } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      ratingDistribution: ratingDistribution.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET MY REVIEWS (Reviews I've written) ----------
export const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await EquipmentReview.find({ reviewerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('equipmentId', 'name images category');

    const total = await EquipmentReview.countDocuments({ reviewerId: req.user.id });

    res.status(200).json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- CHECK IF CAN REVIEW ----------
export const canReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await EquipmentBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ canReview: false, message: "Booking not found" });
    }

    const canReview = 
      booking.renterId.toString() === req.user.id && 
      booking.status === 'completed' && 
      !booking.hasReview;

    res.status(200).json({ 
      canReview,
      reason: !canReview ? (
        booking.hasReview ? "Already reviewed" : 
        booking.status !== 'completed' ? "Booking not completed" :
        "Not authorized"
      ) : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
