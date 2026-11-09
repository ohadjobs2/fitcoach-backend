const workoutService = require('../services/workoutService');

const createNewWorkout = async (req, res) => {
  try {
    // ה-Middleware (protect) וידא את הטוקן ושתל את ה-id של המשתמש בתוך req.user!
    // ככה אנחנו יודעים בדיוק של מי האימון בלי לבקש ממנו להקליד את זה.
    const userId = req.user.id; 
    const workoutData = req.body;

    // מעבירים לשף את ה-ID ואת פרטי האימון
    const workout = await workoutService.createWorkout(userId, workoutData);

    res.status(201).json({
      success: true,
      message: "Workout created successfully!",
      workout
    });

  } catch (error) {
    console.error("Error creating workout:", error);
    res.status(500).json({ message: "Server error creating workout" });
  }
};
const getWorkouts = async (req, res) => {
  try {
    const userId = req.user.id; // שוב, ה-Middleware מספק לנו את זהות המשתמש
    const workouts = await workoutService.getUserWorkouts(userId);

    res.status(200).json({
      success: true,
      count: workouts.length,
      workouts
    });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({ message: "Server error fetching workouts" });
  }
};
module.exports = { createNewWorkout, getWorkouts };