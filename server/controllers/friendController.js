const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Helper to get socket io instance
const getIO = (req) => req.app.get('io');

// @route POST /api/friends/request
exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required.' });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself.' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User does not exist.' });
    }

    // Check if any existing request exists
    const existing = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'You are already connected.' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'A friend request is already pending.' });
      }
      // If previously rejected, allow re-requesting by updating
      existing.senderId = senderId;
      existing.receiverId = receiverId;
      existing.status = 'pending';
      await existing.save();

      const io = getIO(req);
      if (io) {
        io.to(`user_${receiverId}`).emit('friend_request_received', {
          request: existing,
          sender: req.user
        });
      }

      return res.status(200).json({ success: true, message: 'Friend request sent.', request: existing });
    }

    const newRequest = await FriendRequest.create({
      senderId,
      receiverId,
      status: 'pending'
    });

    const io = getIO(req);
    if (io) {
      io.to(`user_${receiverId}`).emit('friend_request_received', {
        request: newRequest,
        sender: req.user
      });
    }

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully.',
      request: newRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request.' });
  }
};

// @route POST /api/friends/respond/:requestId
exports.respondToRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be accept or reject.' });
    }

    const friendRequest = await FriendRequest.findById(requestId)
      .populate('senderId', 'username displayName avatar isOnline lastSeen')
      .populate('receiverId', 'username displayName avatar isOnline lastSeen');

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (friendRequest.receiverId._id.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to respond to this request.' });
    }

    if (action === 'reject') {
      friendRequest.status = 'rejected';
      await friendRequest.save();

      const io = getIO(req);
      if (io) {
        io.to(`user_${friendRequest.senderId._id}`).emit('friend_request_rejected', {
          requestId: friendRequest._id,
          by: req.user
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Friend request declined.'
      });
    }

    // If accepted:
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Find or create Conversation between both users
    let conversation = await Conversation.findOne({
      participants: { $all: [friendRequest.senderId._id, friendRequest.receiverId._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [friendRequest.senderId._id, friendRequest.receiverId._id]
      });
    }

    await conversation.populate('participants', 'username displayName avatar isOnline lastSeen bio relationshipStartDate customQuote');

    const io = getIO(req);
    if (io) {
      // Notify both parties
      io.to(`user_${friendRequest.senderId._id}`).emit('friend_request_accepted', {
        requestId: friendRequest._id,
        conversation,
        friend: req.user
      });
      io.to(`user_${friendRequest.receiverId._id}`).emit('friend_request_accepted', {
        requestId: friendRequest._id,
        conversation,
        friend: friendRequest.senderId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Friend request accepted! Private conversation created.',
      conversation
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to friend request.' });
  }
};

// @route DELETE /api/friends/cancel/:requestId
exports.cancelRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (friendRequest.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own sent requests.' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    const io = getIO(req);
    if (io) {
      io.to(`user_${friendRequest.receiverId}`).emit('friend_request_cancelled', {
        requestId
      });
    }

    res.status(200).json({ success: true, message: 'Friend request cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel request.' });
  }
};

// @route GET /api/friends/requests
exports.getFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const incoming = await FriendRequest.find({
      receiverId: currentUserId,
      status: 'pending'
    })
      .populate('senderId', 'username displayName avatar isOnline lastSeen bio')
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({
      senderId: currentUserId,
      status: 'pending'
    })
      .populate('receiverId', 'username displayName avatar isOnline lastSeen bio')
      .sort({ createdAt: -1 });

    // Accepted friends
    const acceptedRequests = await FriendRequest.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      status: 'accepted'
    })
      .populate('senderId', 'username displayName avatar isOnline lastSeen bio relationshipStartDate customQuote')
      .populate('receiverId', 'username displayName avatar isOnline lastSeen bio relationshipStartDate customQuote')
      .sort({ updatedAt: -1 });

    // Match with conversationId
    const conversations = await Conversation.find({
      participants: currentUserId
    });

    const friends = acceptedRequests.map((reqDoc) => {
      const isSender = reqDoc.senderId._id.toString() === currentUserId.toString();
      const friendUser = isSender ? reqDoc.receiverId : reqDoc.senderId;
      const conv = conversations.find((c) =>
        c.participants.some((p) => p.toString() === friendUser._id.toString())
      );

      return {
        _id: friendUser._id,
        username: friendUser.username,
        displayName: friendUser.displayName,
        avatar: friendUser.avatar,
        bio: friendUser.bio,
        isOnline: friendUser.isOnline,
        lastSeen: friendUser.lastSeen,
        relationshipStartDate: friendUser.relationshipStartDate,
        customQuote: friendUser.customQuote,
        conversationId: conv ? conv._id : null,
        friendRequestId: reqDoc._id
      };
    });

    res.status(200).json({
      success: true,
      incoming,
      outgoing,
      friends
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve friend requests.' });
  }
};

// @route DELETE /api/friends/remove/:friendId
exports.removeFriend = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { friendId } = req.params;

    // Delete friend request records
    await FriendRequest.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: friendId },
        { senderId: friendId, receiverId: currentUserId }
      ]
    });

    res.status(200).json({ success: true, message: 'Friend removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove friend.' });
  }
};
