const mealService = require('../services/mealService');

const addMealToLog = async (req, res) => {
  try {
    const meal = await mealService.addMeal(req.body);

    res.status(201).json({
      success: true,
      message: "Meal added successfully!",
      meal
    });
  } catch (error) {
    console.error("Error adding meal:", error);
    res.status(500).json({ message: "Server error adding meal" });
  }
};

module.exports = { addMealToLog };