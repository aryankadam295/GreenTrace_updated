import mongoose from "mongoose";
import Equipment from "../models/Equipment.js";
import User from "../models/User.js";
import EquipmentBooking from "../models/EquipmentBooking.js";
import { deleteStoredFile, getUploadedFileUrl } from '../utils/storage.js';

// ---------- CREATE EQUIPMENT ----------
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      pricePerDay,
      availabilityStart,
      availabilityEnd,
      brand,
      model,
      year,
      condition
    } = req.body;

    // Get farmer details from authenticated user
    const farmer = await User.findById(req.user.id);
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(403).json({ message: "Access denied. Only farmers can list equipment." });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => getUploadedFileUrl(file));
    }

    // Create new equipment
    const newEquipment = await Equipment.create({
      name,
      category,
      description,
      pricePerDay,
      location: {
        village: farmer.village,
        district: farmer.district,
        state: farmer.state
      },
      images: imageUrls,
      availabilityStart,
      availabilityEnd,
      ownerId: farmer._id,
      ownerName: farmer.fullName,
      ownerPhone: farmer.phoneNumber,
      specifications: {
        brand,
        model,
        year: year ? parseInt(year) : undefined,
        condition: condition || 'Good'
      }
    });

    res.status(201).json({
      message: "Equipment listed successfully",
      equipment: newEquipment
    });
  } catch (error) {
    // Clean up uploaded files if creation fails
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map((file) => deleteStoredFile(getUploadedFileUrl(file), 'equipment')));
    }
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET MY EQUIPMENT (Owner's listings) ----------
export const getMyEquipment = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { ownerId: req.user.id };
    if (status) query.status = status;

    const equipment = await Equipment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Equipment.countDocuments(query);

    res.status(200).json({
      equipment,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET ALL AVAILABLE EQUIPMENT (Browse) ----------
export const getAllEquipment = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      state, 
      district,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query - exclude user's own equipment
    const query = { 
      status: 'available',
      ownerId: { $ne: req.user.id },
      availabilityEnd: { $gte: new Date() }
    };
    
    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const equipment = await Equipment.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('ownerId', 'fullName phoneNumber');

    const total = await Equipment.countDocuments(query);

    // Get unique categories and locations for filters
    const categories = await Equipment.distinct('category', { status: 'available' });
    const states = await Equipment.distinct('location.state', { status: 'available' });

    res.status(200).json({
      equipment,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: { categories, states }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE EQUIPMENT ----------
export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('ownerId', 'fullName phoneNumber village district state');
    
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Increment views if not the owner
    if (equipment.ownerId._id.toString() !== req.user.id) {
      equipment.views += 1;
      await equipment.save();
    }

    // Get existing bookings for this equipment (to show unavailable dates)
    const bookings = await EquipmentBooking.find({
      equipmentId: equipment._id,
      status: { $in: ['approved', 'in-use'] }
    }).select('startDate endDate');

    res.status(200).json({ 
      equipment,
      bookedDates: bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE EQUIPMENT ----------
export const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Check if user is the owner
    if (equipment.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only update your own equipment." });
    }

    // Handle new image uploads
    let imageUrls = equipment.images || [];
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => getUploadedFileUrl(file));
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Update specifications if provided
    if (req.body.brand || req.body.model || req.body.year || req.body.condition) {
      updateData.specifications = {
        ...equipment.specifications,
        brand: req.body.brand || equipment.specifications?.brand,
        model: req.body.model || equipment.specifications?.model,
        year: req.body.year ? parseInt(req.body.year) : equipment.specifications?.year,
        condition: req.body.condition || equipment.specifications?.condition
      };
    }

    if (req.files && req.files.length > 0) {
      updateData.images = imageUrls;
    }

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Equipment updated successfully",
      equipment: updatedEquipment
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map((file) => deleteStoredFile(getUploadedFileUrl(file), 'equipment')));
    }
    res.status(500).json({ message: error.message });
  }
};

// ---------- DELETE EQUIPMENT ----------
export const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (equipment.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only delete your own equipment." });
    }

    // Check for active bookings
    const activeBookings = await EquipmentBooking.countDocuments({
      equipmentId: equipment._id,
      status: { $in: ['requested', 'approved', 'in-use'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: "Cannot delete equipment with active bookings. Please complete or cancel all bookings first." 
      });
    }

    // Delete associated image files
    if (equipment.images && equipment.images.length > 0) {
      await Promise.all(equipment.images.map((imageUrl) => deleteStoredFile(imageUrl, 'equipment')));
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Equipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET EQUIPMENT ANALYTICS ----------
export const getEquipmentAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const totalEquipment = await Equipment.countDocuments({ ownerId });
    const availableEquipment = await Equipment.countDocuments({ ownerId, status: 'available' });
    const rentedEquipment = await Equipment.countDocuments({ ownerId, status: 'rented' });

    // Get booking stats
    const totalBookings = await EquipmentBooking.countDocuments({ ownerId });
    const pendingRequests = await EquipmentBooking.countDocuments({ ownerId, status: 'requested' });
    const completedBookings = await EquipmentBooking.countDocuments({ ownerId, status: 'completed' });

    // Calculate total earnings
    const earningsResult = await EquipmentBooking.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId), status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: "$totalPrice" } } }
    ]);

    // Get total views
    const viewsResult = await Equipment.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    res.status(200).json({
      analytics: {
        totalEquipment,
        availableEquipment,
        rentedEquipment,
        totalBookings,
        pendingRequests,
        completedBookings,
        totalEarnings: earningsResult[0]?.totalEarnings || 0,
        totalViews: viewsResult[0]?.totalViews || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE EQUIPMENT STATUS ----------
export const updateEquipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (equipment.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    equipment.status = status;
    await equipment.save();

    res.status(200).json({
      message: "Equipment status updated",
      equipment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
