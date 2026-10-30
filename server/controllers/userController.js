const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');

// @route GET /api/users/discover
// Discover other users and annotate each with the relationship status to req.user
exports.discoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { search } = req.query;

    const query = { _id: { $ne: currentUserId } };
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ username: regex }, { displayName: regex }];
    }

    const users = await User.find(query)
      .select('username displayName avatar isOnline lastSeen bio createdAt')
      .sort({ isOnline: -1, lastSeen: -1 })
      .limit(50);

    // Get all friend requests involving current user
    const requests = await FriendRequest.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    });

    // Get all conversations involving current user
    const conversations = await Conversation.find({
      participants: currentUserId
    });

    const userCards = users.map((u) => {
      const uIdStr = u._id.toString();
      let status = 'none';
      let requestId = null;
      let conversationId = null;

      // Check friend requests
      const relReq = requests.find(
        (r) =>
          (r.senderId.toString() === currentUserId.toString() &&
            r.receiverId.toString() === uIdStr) ||
          (r.receiverId.toString() === currentUserId.toString() &&
            r.senderId.toString() === uIdStr)
      );

      if (relReq) {
        requestId = relReq._id;
        if (relReq.status === 'accepted') {
          status = 'friends';
        } else if (relReq.status === 'pending') {
          status =
            relReq.senderId.toString() === currentUserId.toString()
              ? 'sent'
              : 'received';
        }
      }

      // Check if conversation exists
      const conv = conversations.find((c) =>
        c.participants.some((p) => p.toString() === uIdStr)
      );
      if (conv) {
        conversationId = conv._id;
      }

      return {
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        bio: u.bio,
        isOnline: u.isOnline,
        lastSeen: u.lastSeen,
        createdAt: u.createdAt,
        relationshipStatus: status,
        requestId,
        conversationId
      };
    });

    res.status(200).json({
      success: true,
      users: userCards
    });
  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover users.'
    });
  }
};

// @route GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'username displayName avatar isOnline lastSeen bio createdAt relationshipStartDate customQuote'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load user profile' });
  }
};

// @route GET /api/users/vapid-key
exports.getVapidPublicKey = async (req, res) => {
  try {
    const { VAPID_PUBLIC_KEY } = require('../config/webpush');
    res.status(200).json({ success: true, publicKey: VAPID_PUBLIC_KEY });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve VAPID key' });
  }
};

// @route POST /api/users/subscribe-push
exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Filter out if this exact endpoint already exists, then push updated
    user.pushSubscriptions = (user.pushSubscriptions || []).filter(
      (sub) => sub.endpoint !== subscription.endpoint
    );

    user.pushSubscriptions.push({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    await user.save();
    res.status(200).json({ success: true, message: 'Push subscription saved successfully.' });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({ success: false, message: 'Failed to save push subscription.' });
  }
};

// @route POST /api/users/unsubscribe-push
exports.unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } }
    });

    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe.' });
  }
};
