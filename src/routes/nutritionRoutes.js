const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/nutrition
router.post('/', protect, nutritionController.startDailyLog);
// GET /api/nutrition/today
router.get('/today', protect, nutritionController.getTodayNutrition);
// POST /api/nutrition/complete - סגירת יום ובדיקת יעדים
router.post('/complete', protect, nutritionController.completeDay);
module.exports = router;