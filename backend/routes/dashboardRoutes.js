const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Base path will be: /api/admin-api/dashboard

router.get('/stats', authMiddleware, checkRole(['superadmin', 'admin']), dashboardController.getDashboardStats);
router.get('/performance', authMiddleware, checkRole(['superadmin', 'admin']), dashboardController.getPerformanceMetrics);
router.get('/activity', authMiddleware, checkRole(['superadmin', 'admin']), dashboardController.getActivityChart);

module.exports = router;
