const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendPushToUser } = require('../utils/pushNotifier');

const getIO = (req) => req.app.get('io');

// @route GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate(
        'participants',
        'username displayName avatar isOnline lastSeen bio relationshipStartDate customQuote'
      )
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const formatted = conversations.map((conv) => {
      const recipient = conv.participants.find(
        (p) => p._id.toString() !== currentUserId.toString()
      );
      const unreadCount = conv.unreadCounts?.get(currentUserId.toString()) || 0;

      return {
        _id: conv._id,
        recipient: recipient || null,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
};

// @route GET /api/chat/conversations/:id
exports.getConversationById = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id).populate(
      'participants',
      'username displayName avatar isOnline lastSeen bio relationshipStartDate customQuote'
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.participants.some(
      (p) => p._id.toString() === currentUserId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this conversation.' });
    }

    const recipient = conversation.participants.find(
      (p) => p._id.toString() !== currentUserId.toString()
    );

    res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
        recipient,
        participants: conversation.participants,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversation details.' });
  }
};

// @route GET /api/chat/messages/:conversationId
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username displayName avatar')
      .sort({ createdAt: 1 });

    // Mark messages as delivered for current user
    const undeliveredIds = messages
      .filter(
        (m) =>
          m.senderId._id.toString() !== currentUserId.toString() &&
          !m.deliveredTo.some((id) => id.toString() === currentUserId.toString())
      )
      .map((m) => m._id);

    if (undeliveredIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: undeliveredIds } },
        { $addToSet: { deliveredTo: currentUserId } }
      );
    }

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
};

// @route POST /api/chat/messages
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId, content, messageType, fileUrl, fileName, fileSize, replyTo } = req.body;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required.' });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || '',
      messageType: messageType || (fileUrl ? 'image' : 'text'),
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      replyTo: replyTo || undefined,
      deliveredTo: [],
      readBy: []
    });

    await message.populate('senderId', 'username displayName avatar');

    // Update conversation lastMessage & increment unread count
    conversation.lastMessage = message._id;
    const currentUnread = conversation.unreadCounts.get(otherParticipantId.toString()) || 0;
    conversation.unreadCounts.set(otherParticipantId.toString(), currentUnread + 1);
    await conversation.save();

    // Broadcast via Socket.IO
    const io = getIO(req);
    if (io) {
      io.to(`conv_${conversationId}`).emit('new_message', { message });
      io.to(`user_${otherParticipantId}`).emit('unread_update', {
        conversationId,
        unreadCount: currentUnread + 1,
        message
      });
    }

    // Send Web Push notification (arrives even if partner's app/phone is closed)
    sendPushToUser(otherParticipantId).catch((err) =>
      console.error('WebPush notification dispatch error:', err)
    );

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// @route POST /api/chat/messages/:id/react
exports.reactToMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji reaction is required.' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Toggle reaction: if user already gave this emoji, remove it; if different emoji, update; if none, add
    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === currentUserId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Remove reaction
        message.reactions.splice(existingIndex, 1);
      } else {
        // Change reaction
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].userName = req.user.displayName;
      }
    } else {
      message.reactions.push({
        emoji,
        userId: currentUserId,
        userName: req.user.displayName
      });
    }

    await message.save();

    const io = getIO(req);
    if (io) {
      io.to(`conv_${message.conversationId}`).emit('message_reaction_updated', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to react to message.' });
  }
};

// @route DELETE /api/chat/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.fileUrl = '';
    message.fileName = '';
    await message.save();

    const io = getIO(req);
    if (io) {
      io.to(`conv_${message.conversationId}`).emit('message_deleted', {
        messageId: message._id
      });
    }

    res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
};

// @route POST /api/chat/conversations/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Reset unread count for current user
    conversation.unreadCounts.set(currentUserId.toString(), 0);
    await conversation.save();

    // Mark unread messages sent by others as read
    const result = await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: currentUserId },
        readBy: { $ne: currentUserId }
      },
      {
        $addToSet: { readBy: currentUserId, deliveredTo: currentUserId }
      }
    );

    const io = getIO(req);
    if (io) {
      io.to(`conv_${id}`).emit('messages_read', {
        conversationId: id,
        readerId: currentUserId
      });
    }

    res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read.' });
  }
};
