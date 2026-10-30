const express = require('express');
const router = express.Router();
const { discoverUsers, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/discover', protect, discoverUsers);
router.get('/:id', protect, getUserProfile);

module.exports = router;
