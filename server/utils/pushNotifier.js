const User = require('../models/User');
const { webpush } = require('../config/webpush');

/**
 * Sends a disguised push notification to a recipient user's registered devices.
 * Works even when the recipient's phone/browser is locked or closed.
 *
 * @param {string|ObjectId} recipientId - User ID of the partner
 * @param {object} payload - Optional payload override (defaults to disguised todo text)
 */
const sendPushToUser = async (recipientId, customPayload = null) => {
  try {
    const user = await User.findById(recipientId).select('pushSubscriptions');
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const disguisedBodies = [
      'A new priority task was added to your daily list.',
      'Daily focus schedule synchronized successfully.',
      'Check your daily list for an updated priority task.',
      'A new daily rhythm item was added to your planner.'
    ];

    const randomBody =
      disguisedBodies[Math.floor(Math.random() * disguisedBodies.length)];

    const payload = JSON.stringify({
      title: 'New task added',
      body: customPayload?.body || randomBody,
      url: customPayload?.url || '/'
    });

    const staleEndpoints = [];

    const sendPromises = user.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        // If subscription has expired or is gone (HTTP 404 or 410)
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
        } else {
          console.warn('WebPush delivery warning:', err.statusCode || err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    // Clean up stale subscriptions if any were found
    if (staleEndpoints.length > 0) {
      await User.findByIdAndUpdate(recipientId, {
        $pull: {
          pushSubscriptions: { endpoint: { $in: staleEndpoints } }
        }
      });
    }
  } catch (error) {
    console.error('Failed to dispatch background WebPush:', error.message);
  }
};

module.exports = { sendPushToUser };
