const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  reactToMessage,
  deleteMessage,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);
router.post('/messages/:id/react', reactToMessage);
router.delete('/messages/:id', deleteMessage);
router.post('/conversations/:id/read', markAsRead);

module.exports = router;
