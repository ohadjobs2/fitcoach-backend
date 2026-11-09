const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/exercises
router.post('/', protect, exerciseController.createNewExercise);

module.exports = router;