const nutritionService = require('../services/nutritionService');

const startDailyLog = async (req, res) => {
  try {
    // מחברים את הנתונים מהבקשה יחד עם ה-ID של המשתמש המחובר
    const nutritionData = {
      ...req.body,
      userId: req.user.id
    };

    const dailyLog = await nutritionService.createDailyLog(nutritionData);

    res.status(201).json({
      success: true,
      message: "Daily nutrition log started!",
      dailyLog
    });
  } catch (error) {
    console.error("Error creating daily log:", error);
    res.status(500).json({ message: "Server error creating daily nutrition" });
  }
};
const getTodayNutrition = async (req, res) => {
  try {
    const log = await nutritionService.getTodayLog(req.user.id);
    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error("Error fetching daily nutrition:", error);
    res.status(500).json({ message: "Server error fetching nutrition log" });
  }
};
const completeDay = async (req, res) => {
  try {
    const log = await nutritionService.getTodayLog(req.user.id);

    if (!log) {
      return res.status(404).json({ message: "לא נמצא יומן תזונה להיום" });
    }

    // בודקים אם עמדת ביעדים (הכי קריטי למסה - יעד החלבון)
    const isProteinMet = log.totalProtein >= log.targetProtein;
    const isCaloriesMet = log.totalCalories >= log.targetCalories;

    let message = "סיכום יומן התזונה: ";
    
    // מכינים את ההודעה שתקפוץ באפליקציה בהתאם לתוצאה
    if (isProteinMet) {
      message += "כל הכבוד אלוף! עמדת ביעד החלבון שלך להיום! 💪🔥";
    } else {
      const missingProtein = log.targetProtein - log.totalProtein;
      message += `חסרים לך עוד ${missingProtein} גרם חלבון כדי להגיע ליעד.`;
    }

    res.status(200).json({
      success: true,
      goalAchieved: isProteinMet,
      message: message,
      summary: {
        protein: `${log.totalProtein} / ${log.targetProtein}g`,
        calories: `${log.totalCalories} / ${log.targetCalories}kcal`
      }
    });

  } catch (error) {
    console.error("Error completing day:", error);
    res.status(500).json({ message: "Server error completing day" });
  }
};

// אל תשכח להוסיף את הפונקציה לייצוא בסוף הקובץ!
module.exports = { startDailyLog, getTodayNutrition, completeDay };