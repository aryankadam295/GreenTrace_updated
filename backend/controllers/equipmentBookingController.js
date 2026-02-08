import mongoose from "mongoose";
import EquipmentBooking from "../models/EquipmentBooking.js";
import Equipment from "../models/Equipment.js";
import User from "../models/User.js";

// ---------- CHECK AVAILABILITY (Double-booking prevention) ----------
const checkDateConflict = async (equipmentId, startDate, endDate, excludeBookingId = null) => {
  const query = {
    equipmentId,
    status: { $in: ['requested', 'approved', 'in-use'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await EquipmentBooking.findOne(query);
  return conflictingBooking;
};

// ---------- CREATE BOOKING REQUEST ----------
export const createBooking = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, message } = req.body;
    const renterId = req.user.id;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    // Get equipment details
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Check if equipment is available
    if (equipment.status !== 'available') {
      return res.status(400).json({ message: "Equipment is not available for booking" });
    }

    // Prevent booking own equipment
    if (equipment.ownerId.toString() === renterId) {
      return res.status(400).json({ message: "You cannot book your own equipment" });
    }

    // Check date availability within equipment's availability range
    if (start < equipment.availabilityStart || end > equipment.availabilityEnd) {
      return res.status(400).json({ 
        message: `Equipment is only available from ${equipment.availabilityStart.toDateString()} to ${equipment.availabilityEnd.toDateString()}` 
      });
    }

    // Check for conflicting bookings (double-booking prevention)
    const conflict = await checkDateConflict(equipmentId, start, end);
    if (conflict) {
      return res.status(400).json({ 
        message: "Equipment is already booked for these dates. Please select different dates.",
        conflictDates: { start: conflict.startDate, end: conflict.endDate }
      });
    }

    // Calculate pricing
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * equipment.pricePerDay;

    // Create booking
    const newBooking = await EquipmentBooking.create({
      equipmentId,
      renterId,
      ownerId: equipment.ownerId,
      startDate: start,
      endDate: end,
      totalDays,
      pricePerDay: equipment.pricePerDay,
      totalPrice,
      renterMessage: message,
      statusHistory: [{
        status: 'requested',
        changedBy: renterId,
        note: 'Booking requested'
      }]
    });

    // Populate for response
    const populatedBooking = await EquipmentBooking.findById(newBooking._id)
      .populate('equipmentId', 'name images category')
      .populate('ownerId', 'fullName phoneNumber');

    res.status(201).json({
      message: "Booking request submitted successfully",
      booking: populatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET MY BOOKINGS (As Renter) ----------
export const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { renterId: req.user.id };
    if (status) query.status = status;

    const bookings = await EquipmentBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('equipmentId', 'name images category pricePerDay location')
      .populate('ownerId', 'fullName phoneNumber');

    const total = await EquipmentBooking.countDocuments(query);

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET BOOKING REQUESTS (As Owner) ----------
export const getBookingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { ownerId: req.user.id };
    if (status) query.status = status;

    const bookings = await EquipmentBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('equipmentId', 'name images category')
      .populate('renterId', 'fullName phoneNumber village district state');

    const total = await EquipmentBooking.countDocuments(query);

    // Get counts by status
    const statusCounts = await EquipmentBooking.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE BOOKING STATUS ----------
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, response } = req.body;
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await EquipmentBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate status transition and permissions
    const validTransitions = {
      'requested': ['approved', 'rejected', 'cancelled'],
      'approved': ['in-use', 'cancelled'],
      'in-use': ['completed'],
      'rejected': [],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from '${booking.status}' to '${status}'` 
      });
    }

    // Permission checks
    const isOwner = booking.ownerId.toString() === userId;
    const isRenter = booking.renterId.toString() === userId;

    // Owner can: approve, reject
    // Renter can: cancel (if still requested)
    // Either can: mark in-use (when approved), complete
    if (status === 'approved' || status === 'rejected') {
      if (!isOwner) {
        return res.status(403).json({ message: "Only the equipment owner can approve or reject bookings" });
      }
    }

    if (status === 'cancelled' && booking.status === 'requested') {
      if (!isRenter && !isOwner) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }
    }

    // For approved bookings, verify no date conflict exists
    if (status === 'approved') {
      const conflict = await checkDateConflict(
        booking.equipmentId, 
        booking.startDate, 
        booking.endDate, 
        bookingId
      );
      if (conflict) {
        return res.status(400).json({ 
          message: "Cannot approve - dates conflict with another booking" 
        });
      }
    }

    // Update booking
    booking.status = status;
    if (response) booking.ownerResponse = response;
    booking.statusHistory.push({
      status,
      changedBy: userId,
      note: response || `Status changed to ${status}`
    });

    await booking.save();

    // Update equipment status if needed
    if (status === 'in-use') {
      await Equipment.findByIdAndUpdate(booking.equipmentId, { status: 'rented' });
    } else if (status === 'completed' || status === 'cancelled') {
      // Check if there are other active bookings before marking available
      const activeBookings = await EquipmentBooking.countDocuments({
        equipmentId: booking.equipmentId,
        status: 'in-use',
        _id: { $ne: bookingId }
      });
      
      if (activeBookings === 0) {
        await Equipment.findByIdAndUpdate(booking.equipmentId, { status: 'available' });
      }

      // Increment total bookings count on completion
      if (status === 'completed') {
        await Equipment.findByIdAndUpdate(booking.equipmentId, { $inc: { totalBookings: 1 } });
      }
    }

    const updatedBooking = await EquipmentBooking.findById(bookingId)
      .populate('equipmentId', 'name images category')
      .populate('renterId', 'fullName phoneNumber')
      .populate('ownerId', 'fullName phoneNumber');

    res.status(200).json({
      message: `Booking ${status} successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE BOOKING ----------
export const getBookingById = async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id)
      .populate('equipmentId', 'name images category pricePerDay location ownerName')
      .populate('renterId', 'fullName phoneNumber village district state')
      .populate('ownerId', 'fullName phoneNumber');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only owner or renter can view
    if (booking.ownerId._id.toString() !== req.user.id && 
        booking.renterId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- CHECK AVAILABILITY FOR DATES ----------
export const checkAvailability = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.query;

    const conflict = await checkDateConflict(
      equipmentId, 
      new Date(startDate), 
      new Date(endDate)
    );

    res.status(200).json({
      available: !conflict,
      conflict: conflict ? { 
        startDate: conflict.startDate, 
        endDate: conflict.endDate 
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET RENTER BOOKING ANALYTICS ----------
export const getRenterAnalytics = async (req, res) => {
  try {
    const renterId = req.user.id;

    const totalBookings = await EquipmentBooking.countDocuments({ renterId });
    const activeBookings = await EquipmentBooking.countDocuments({ 
      renterId, 
      status: { $in: ['requested', 'approved', 'in-use'] } 
    });
    const completedBookings = await EquipmentBooking.countDocuments({ renterId, status: 'completed' });

    // Calculate total spent
    const spentResult = await EquipmentBooking.aggregate([
      { $match: { renterId: new mongoose.Types.ObjectId(renterId), status: 'completed' } },
      { $group: { _id: null, totalSpent: { $sum: "$totalPrice" } } }
    ]);

    res.status(200).json({
      analytics: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpent: spentResult[0]?.totalSpent || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
