const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router.get('/all', badgeController.getAllBadges);
router.get('/my/:address', badgeController.getMyBadges);

module.exports = router;
