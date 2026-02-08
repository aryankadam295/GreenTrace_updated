import express from 'express';
import chatController from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Get all chats for the authenticated user
router.get('/', chatController.getUserChats);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Create a new chat
router.post('/', chatController.createChat);

// Get messages for a specific chat
router.get('/:chatId', chatController.getChatMessages);

// Send a message in a chat
router.post('/:chatId/messages', chatController.sendMessage);

export default router;
