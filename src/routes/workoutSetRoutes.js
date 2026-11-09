const express = require('express');
const router = express.Router();
const workoutSetController = require('../controllers/workoutSetController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/sets
router.post('/', protect, workoutSetController.addSetToWorkout);

module.exports = router;