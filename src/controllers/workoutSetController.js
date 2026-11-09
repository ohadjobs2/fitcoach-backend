const workoutSetService = require('../services/workoutSetService');

const addSetToWorkout = async (req, res) => {
  try {
    const set = await workoutSetService.createSet(req.body);

    res.status(201).json({
      success: true,
      message: "Set added successfully!",
      set
    });
  } catch (error) {
    console.error("Error adding set:", error);
    res.status(500).json({ message: "Server error adding set" });
  }
};

module.exports = { addSetToWorkout };