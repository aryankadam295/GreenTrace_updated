import EquipmentChat from '../models/EquipmentChat.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';

// ---------- GET USER'S EQUIPMENT CHATS ----------
export const getEquipmentChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await EquipmentChat.find({
      participants: userId
    })
    .populate('participants', 'fullName role')
    .populate('equipment', 'name images category')
    .populate('lastMessage.sender', 'fullName')
    .sort({ 'lastMessage.timestamp': -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching equipment chats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

// ---------- GET MESSAGES FOR A CHAT ----------
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await EquipmentChat.findOne({
      _id: chatId,
      participants: userId
    })
    .populate('participants', 'fullName role')
    .populate('equipment', 'name images category ownerId')
    .populate('messages.sender', 'fullName role');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Mark messages as read for current user
    chat.messages.forEach(message => {
      if (message.sender._id.toString() !== userId && !message.read) {
        message.read = true;
      }
    });

    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// ---------- SEND MESSAGE ----------
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const chat = await EquipmentChat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Add new message
    const newMessage = {
      sender: userId,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      sender: userId,
      message: message.trim(),
      timestamp: new Date()
    };

    await chat.save();

    // Populate the new message for response
    await chat.populate('messages.sender', 'fullName role');

    const addedMessage = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      message: addedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// ---------- CREATE OR GET EQUIPMENT CHAT ----------
export const createEquipmentChat = async (req, res) => {
  try {
    const { equipmentId, message } = req.body;
    const userId = req.user.id;

    // Check if equipment exists
    const equipment = await Equipment.findById(equipmentId).populate('ownerId', 'fullName role');
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Prevent chatting with yourself
    if (equipment.ownerId._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself'
      });
    }

    // Check if chat already exists
    const existingChat = await EquipmentChat.findOne({
      participants: { $all: [userId, equipment.ownerId._id] },
      equipment: equipmentId
    });

    if (existingChat) {
      // If message provided, add it to existing chat
      if (message && message.trim()) {
        existingChat.messages.push({
          sender: userId,
          message: message.trim(),
          timestamp: new Date(),
          read: false
        });
        existingChat.lastMessage = {
          sender: userId,
          message: message.trim(),
          timestamp: new Date()
        };
        await existingChat.save();
      }

      await existingChat.populate('participants', 'fullName role');
      await existingChat.populate('equipment', 'name images category');
      await existingChat.populate('messages.sender', 'fullName role');

      return res.status(200).json({
        success: true,
        chat: existingChat,
        message: 'Chat already exists'
      });
    }

    // Create new chat
    const newChat = new EquipmentChat({
      participants: [userId, equipment.ownerId._id],
      equipment: equipmentId,
      messages: message ? [{
        sender: userId,
        message: message.trim(),
        timestamp: new Date(),
        read: false
      }] : [],
      lastMessage: message ? {
        sender: userId,
        message: message.trim(),
        timestamp: new Date()
      } : null
    });

    await newChat.save();

    // Populate for response
    await newChat.populate('participants', 'fullName role');
    await newChat.populate('equipment', 'name images category');
    await newChat.populate('messages.sender', 'fullName role');

    res.status(201).json({
      success: true,
      chat: newChat
    });
  } catch (error) {
    console.error('Error creating equipment chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
};

// ---------- GET UNREAD COUNT ----------
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await EquipmentChat.find({
      participants: userId
    });

    let unreadCount = 0;
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (message.sender.toString() !== userId && !message.read) {
          unreadCount++;
        }
      });
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
};
