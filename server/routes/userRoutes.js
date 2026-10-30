const express = require('express');
const router = express.Router();
const {
  discoverUsers,
  getUserProfile,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe-push', protect, subscribePush);
router.post('/unsubscribe-push', protect, unsubscribePush);

router.get('/discover', protect, discoverUsers);
router.get('/:id', protect, getUserProfile);

module.exports = router;
