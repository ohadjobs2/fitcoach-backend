const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/programs/generate - יצירת תוכנית AI
router.post('/generate',  programController.generateAiProgram);
// POST /api/programs/analyze-meal - חישוב ערכי ארוחה עם AI
router.post('/analyze-meal', programController.analyzeMeal);
// DELETE /api/programs/:programId - מחיקת תוכנית
router.delete('/:programId', protect, programController.deleteProgram);
// POST /api/programs/manual - יצירת תוכנית ידנית
router.post('/manual', protect, programController.createManualProgram);
// GET /api/programs/today - שליפת האימון להיום
router.get('/today', protect, programController.getTodayWorkout);
// PUT /api/programs/sets/:setId - עדכון תוצאות סט באימון
router.put('/sets/:setId', protect, programController.logSet);
router.post('/generate-diet', programController.generateDiet);
// POST /api/programs/:programId/workouts - הוספת אימון לתוכנית קיימת
router.post('/:programId/workouts', protect, programController.addManualWorkout);
router.get('/progress/:userId/:exercise', programController.getExerciseProgress);
// GET /api/programs - שליפת התוכניות של המשתמש
router.get('/', protect, programController.getUserPrograms);
router.post('/progress', programController.logExerciseProgress);
router.post('/finish', programController.finishWorkout);
module.exports = router;