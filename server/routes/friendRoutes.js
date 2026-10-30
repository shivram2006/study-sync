const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  respondToRequest,
  cancelRequest,
  getFriendRequests,
  removeFriend
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/request', sendFriendRequest);
router.post('/respond/:requestId', respondToRequest);
router.delete('/cancel/:requestId', cancelRequest);
router.get('/requests', getFriendRequests);
router.delete('/remove/:friendId', removeFriend);

module.exports = router;
