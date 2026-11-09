const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/meals
router.post('/', protect, mealController.addMealToLog);

module.exports = router;