// server/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

// All messaging endpoints require an authenticated user
router.use(requireAuth);

// Mock providers data (in production, fetch from User collection)
const MOCK_PROVIDERS = [
  { id: 'doc1', name: 'Dr. Smith', role: 'doctor', specialty: 'Cardiology' },
  { id: 'doc2', name: 'Dr. Johnson', role: 'doctor', specialty: 'General Practice' },
  { id: 'doc3', name: 'Dr. Brown', role: 'doctor', specialty: 'Dermatology' },
  { id: 'nurse1', name: 'Nurse Williams', role: 'nurse', department: 'Emergency' },
  { id: 'nurse2', name: 'Nurse Davis', role: 'nurse', department: 'ICU' }
];

// Get all providers (for recipient selection)
router.get('/providers', async (req, res) => {
  try {
    res.json(MOCK_PROVIDERS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Cannot view conversations for another user', context: 'Demo / MVP auth' });
    }
    
    // Get unique conversations
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    }).sort({ timestamp: -1 });
    
    // Group by conversation
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUserName = msg.senderId === userId ? msg.recipientName : msg.senderName;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          unreadCount: 0,
          conversationId: msg.conversationId
        });
      }
      
      if (!msg.read && msg.recipientId === userId) {
        const conv = conversationsMap.get(otherUserId);
        conv.unreadCount++;
      }
    });
    
    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between two users
router.get('/messages/:userId/:recipientId', async (req, res) => {
  try {
    const { userId, recipientId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Cannot view messages for another user', context: 'Demo / MVP auth' });
    }
    
    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    }).sort({ timestamp: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { senderId: recipientId, recipientId: userId, read: false },
      { read: true }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const incoming = req.body || {};

    if (req.user.role !== 'admin' && incoming.senderId && incoming.senderId !== req.user.id) {
      return res.status(403).json({ error: 'Sender mismatch with session user', context: 'Demo / MVP auth' });
    }

    const messageData = {
      senderId: req.user.id,
      senderName: incoming.senderName || req.user.email,
      senderRole: req.user.role,
      recipientId: incoming.recipientId,
      recipientName: incoming.recipientName,
      recipientRole: incoming.recipientRole,
      message: incoming.message,
      messageType: incoming.messageType || 'text',
      priority: incoming.priority || 'normal',
    };

    if (!messageData.recipientId || !messageData.recipientName || !messageData.recipientRole || !messageData.message) {
      return res.status(400).json({ error: 'recipientId, recipientName, recipientRole, and message are required', context: 'Demo / MVP auth' });
    }
    
    // Generate conversation ID
    const conversationId = [messageData.senderId, messageData.recipientId].sort().join('-');
    
    const newMessage = new Message({
      ...messageData,
      conversationId,
      timestamp: new Date()
    });
    
    await newMessage.save();
    
    // Simulate auto-response after 2 seconds
    if (messageData.senderRole === 'patient') {
      setTimeout(async () => {
        const autoResponse = new Message({
          conversationId,
          senderId: messageData.recipientId,
          senderName: messageData.recipientName,
          senderRole: messageData.recipientRole,
          recipientId: messageData.senderId,
          recipientName: messageData.senderName,
          recipientRole: messageData.senderRole,
          message: generateAutoResponse(messageData.message),
          messageType: 'text',
          priority: 'normal'
        });
        
        await autoResponse.save();
      }, 2000);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.put('/read/:userId/:senderId', async (req, res) => {
  try {
    const { userId, senderId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Cannot mark messages for another user', context: 'Demo / MVP auth' });
    }
    
    const result = await Message.updateMany(
      { senderId: senderId, recipientId: userId, read: false },
      { read: true }
    );
    
    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Cannot view unread count for another user', context: 'Demo / MVP auth' });
    }
    
    const count = await Message.countDocuments({
      recipientId: userId,
      read: false
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate auto responses
function generateAutoResponse(message) {
  const responses = [
    "Thank you for your message. I've reviewed your concern and will address it shortly.",
    "I understand your situation. Let me provide you with some guidance.",
    "Thank you for reaching out. Based on what you've described, here's my recommendation.",
    "I've received your message. This is an important matter that requires attention.",
    "Thank you for the update. I'll review this information and get back to you soon."
  ];
  
  const keywords = {
    appointment: "I can see you're asking about appointments. I'll check the schedule and confirm availability.",
    prescription: "Regarding your prescription inquiry, I'll review your medication history and respond accordingly.",
    pain: "I understand you're experiencing discomfort. Please monitor your symptoms and let me know if they worsen.",
    urgent: "I see this is urgent. I'm prioritizing your case and will respond within the hour.",
    test: "Regarding your test results, I'll review them and provide a detailed explanation.",
    refill: "I'll process your refill request and send it to your pharmacy within 24 hours."
  };
  
  // Check for keywords
  const lowerMessage = message.toLowerCase();
  for (const [key, response] of Object.entries(keywords)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  // Return random response
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;