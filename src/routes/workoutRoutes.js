const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware'); // ייבוא השומר

// POST /api/workouts
// שים לב איך ה-protect יושב באמצע! רק אם הוא יאשר (next), נגיע לקונטרולר.
router.post('/', protect, workoutController.createNewWorkout);
// GET /api/workouts - שליפת כל האימונים
router.get('/', protect, workoutController.getWorkouts);
module.exports = router;