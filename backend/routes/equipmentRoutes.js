import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadEquipment } from '../middleware/uploadMiddleware.js';

// Equipment controllers
import {
  createEquipment,
  getMyEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getEquipmentAnalytics,
  updateEquipmentStatus
} from '../controllers/equipmentController.js';

// Booking controllers
import {
  createBooking,
  getMyBookings,
  getBookingRequests,
  updateBookingStatus,
  getBookingById,
  checkAvailability,
  getRenterAnalytics
} from '../controllers/equipmentBookingController.js';

// Review controllers
import {
  createReview,
  getEquipmentReviews,
  getMyReviews,
  canReview
} from '../controllers/equipmentReviewController.js';

// Chat controllers
import {
  getEquipmentChats,
  getChatMessages,
  sendMessage,
  createEquipmentChat,
  getUnreadCount
} from '../controllers/equipmentChatController.js';

const router = express.Router();

// ==================== EQUIPMENT ROUTES ====================

// Get all available equipment (browse) - must be before /:id
router.get('/browse', protect, getAllEquipment);

// Get my equipment (as owner)
router.get('/my-equipment', protect, getMyEquipment);

// Get equipment analytics
router.get('/analytics', protect, getEquipmentAnalytics);

// Create new equipment listing
router.post('/', protect, uploadEquipment.array('images', 5), createEquipment);

// Get single equipment by ID
router.get('/:id', protect, getEquipmentById);

// Update equipment
router.put('/:id', protect, uploadEquipment.array('images', 5), updateEquipment);

// Update equipment status
router.patch('/:id/status', protect, updateEquipmentStatus);

// Delete equipment
router.delete('/:id', protect, deleteEquipment);

// ==================== BOOKING ROUTES ====================

// Check availability for dates
router.get('/bookings/check-availability', protect, checkAvailability);

// Get my bookings (as renter)
router.get('/bookings/my-bookings', protect, getMyBookings);

// Get booking requests (as owner)
router.get('/bookings/requests', protect, getBookingRequests);

// Get renter analytics
router.get('/bookings/renter-analytics', protect, getRenterAnalytics);

// Create booking request
router.post('/bookings', protect, createBooking);

// Get single booking
router.get('/bookings/:id', protect, getBookingById);

// Update booking status
router.patch('/bookings/:id/status', protect, updateBookingStatus);

// ==================== REVIEW ROUTES ====================

// Get my reviews
router.get('/reviews/my-reviews', protect, getMyReviews);

// Check if can review
router.get('/reviews/can-review/:bookingId', protect, canReview);

// Create review
router.post('/reviews', protect, createReview);

// Get reviews for equipment
router.get('/reviews/:equipmentId', protect, getEquipmentReviews);

// ==================== CHAT ROUTES ====================

// Get all equipment chats
router.get('/chats', protect, getEquipmentChats);

// Get unread count
router.get('/chats/unread', protect, getUnreadCount);

// Create or get equipment chat
router.post('/chats', protect, createEquipmentChat);

// Get messages for a chat
router.get('/chats/:chatId', protect, getChatMessages);

// Send message
router.post('/chats/:chatId/messages', protect, sendMessage);

export default router;
