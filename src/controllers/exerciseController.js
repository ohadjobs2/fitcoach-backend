const exerciseService = require('../services/exerciseService');

const createNewExercise = async (req, res) => {
  try {
    const exercise = await exerciseService.createExercise(req.body);

    res.status(201).json({
      success: true,
      message: "Exercise added to database!",
      exercise
    });
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({ message: "Server error creating exercise" });
  }
};

module.exports = { createNewExercise };