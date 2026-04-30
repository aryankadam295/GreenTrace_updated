import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find chats where user is a participant
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'fullName role businessName')
    .populate('product', 'productName images price farmerId')
    .populate('lastMessage.sender', 'fullName')
    .sort({ 'lastMessage.timestamp': -1 });

    // Filter chats based on user role
    let filteredChats = chats;

    if (userRole === 'farmer') {
      // Farmers can only see chats for their own products
      filteredChats = chats.filter((chat) => {
        const ownerId = chat?.product?.farmerId?._id || chat?.product?.farmerId;
        return ownerId && ownerId.toString() === userId;
      });
    } else if (userRole === 'merchant') {
      // Merchants can see chats for products they've inquired about
      // This will be filtered based on inquiries later
    }

    res.json({
      success: true,
      chats: filteredChats
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

// Get messages for a specific chat
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    })
    .populate('participants', 'fullName role businessName')
    .populate('product', 'productName images price farmerId')
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

// Send a message in a chat
const sendMessage = async (req, res) => {
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

    const chat = await Chat.findOne({
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

// Create a new chat (typically when a merchant inquires about a product)
const createChat = async (req, res) => {
  try {
    const { productId, message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Both merchants and farmers can initiate chats
    // if (userRole !== 'merchant') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Only merchants can initiate chats'
    //   });
    // }

    // Check if product exists
    const product = await Product.findById(productId).populate('farmerId', 'fullName role businessName');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, product.farmerId._id] },
      product: productId
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        chat: existingChat,
        message: 'Chat already exists for this product'
      });
    }

    // Create new chat
    const newChat = new Chat({
      participants: [userId, product.farmerId._id],
      product: productId,
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
    await newChat.populate('participants', 'fullName role businessName');
    await newChat.populate('product', 'productName images price farmerId');
    await newChat.populate('messages.sender', 'fullName role');

    res.status(201).json({
      success: true,
      chat: newChat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
};

// Get unread message count for user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
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

export default {
  getUserChats,
  getChatMessages,
  sendMessage,
  createChat,
  getUnreadCount
};
