const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// נתיב הרשמה: POST /api/users/register
router.post('/register', userController.registerUser);

// נתיב התחברות: POST /api/users/login
router.post('/login', userController.loginUser);

// נתיבי איפוס סיסמה
router.post('/forgotpassword', userController.forgotPassword);
router.put('/resetpassword/:resettoken', userController.resetPassword);

// נתיב סנכרון למשיכת הנתונים של המשתמש ברגע ההתחברות
router.get('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    
    // שולפים את המשתמש לפי ה-UUID שלו
    const user = await prisma.user.findUnique({
      where: { id },
      // בעתיד נוסיף כאן include: { programs: true, dailyLogs: true } 
      // כשתסיים לבנות את הטבלאות האלו במסד הנתונים
    });

    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    // מחזירים לפרונטאנד את כל מה שצריך כדי לבנות את הדשבורד
    res.status(200).json({
      nutritionGoals: {
        calories: user.targetCalories || 2500,
        protein: user.targetProtein || 150,
        carbs: user.targetCarbs || 300,
        fat: user.targetFats || 80
      },
      // כרגע נחזיר מערכים ריקים עד שניצור את טבלאות הארוחות והאימונים ב-DB
      weeklyPlan: null, 
      mealsLog: []
    });

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: 'שגיאה במשיכת נתוני המשתמש' });
  }
});

module.exports = router;