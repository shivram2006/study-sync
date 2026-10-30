const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Track online socket connections per user
const activeUserSockets = new Map(); // userId -> Set of socketIds

const setupSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_romantic_key_2006_lovesync_token'
      );
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    // Track active socket
    if (!activeUserSockets.has(userId)) {
      activeUserSockets.set(userId, new Set());
    }
    activeUserSockets.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user_${userId}`);

    // Update online status in DB
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      // Broadcast online status to all connected users
      io.emit('user_status_changed', {
        userId,
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (err) {
      console.error('Error updating online status:', err);
    }

    // Join a specific conversation room
    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conv_${conversationId}`);

      // When joining, automatically mark undelivered messages as delivered
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: userId },
            deliveredTo: { $ne: userId }
          },
          {
            $addToSet: { deliveredTo: userId }
          }
        );

        io.to(`conv_${conversationId}`).emit('messages_delivered', {
          conversationId,
          userId
        });
      } catch (err) {
        console.error('Error updating delivery on join:', err);
      }
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conv_${conversationId}`);
    });

    // Mark messages as read / seen
    socket.on('mark_seen', async ({ conversationId }) => {
      if (!conversationId) return;
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: userId },
            readBy: { $ne: userId }
          },
          {
            $addToSet: { readBy: userId, deliveredTo: userId }
          }
        );

        // Reset unread count in conversation doc
        const conv = await Conversation.findById(conversationId);
        if (conv) {
          conv.unreadCounts.set(userId, 0);
          await conv.save();
        }

        io.to(`conv_${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: userId
        });
      } catch (err) {
        console.error('Error marking messages as seen:', err);
      }
    });

    // Typing start
    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        displayName: user.displayName
      });
    });

    // Typing stop
    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      });
    });

    // Client acknowledged message delivery
    socket.on('ack_delivery', async ({ messageId, conversationId }) => {
      if (!messageId) return;
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deliveredTo: userId }
        });
        io.to(`conv_${conversationId}`).emit('message_delivered', {
          messageId,
          userId
        });
      } catch (err) {
        console.error('Error ack delivery:', err);
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      const userSockets = activeUserSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUserSockets.delete(userId);
          const lastSeenDate = new Date();
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: lastSeenDate
            });
            io.emit('user_status_changed', {
              userId,
              isOnline: false,
              lastSeen: lastSeenDate
            });
          } catch (err) {
            console.error('Error updating offline status:', err);
          }
        }
      }
    });
  });
};

module.exports = { setupSocket };
