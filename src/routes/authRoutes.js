const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // ספריית ההצפנה
const jwt = require('jsonwebtoken'); // <-- הוספנו את ספריית הטוקנים!
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// נתיב הרשמה
router.post('/register', async (req, res) => {
  const { name, email, password, age, weight, gender, fitnessGoal } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'האימייל הזה כבר רשום במערכת.' });
    }

    // מערבלים (מצפינים) את הסיסמה לפני השמירה במסד הנתונים
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, // שומרים את הסיסמה המעורבלת
        age, 
        weight, 
        gender, 
        fitnessGoal 
      }
    });

    // יצירת טוקן למשתמש החדש
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '30d' }
    );

    // מחזירים גם את הטוקן החוצה!
    res.status(201).json({ message: 'נרשמת בהצלחה!', user: newUser, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: 'שגיאת שרת פנימית בזמן הרשמה' });
  }
});

// נתיב התחברות
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים.' });
    }

    // אם המשתמש נשמר בלי הצפנה (כמו יעל), נאפשר לו להתחבר בכל זאת כדי לא לשבור לו את החשבון
    const isMatch = user.password.startsWith('$2b$') 
      ? await bcrypt.compare(password, user.password) 
      : password === user.password; 
    
    if (!isMatch) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים.' });
    }

    // יצירת טוקן למשתמש שמתחבר
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '30d' }
    );

    // מחזירים גם את הטוקן החוצה יחד עם הודעת ההצלחה!
    res.status(200).json({ message: 'התחברת בהצלחה!', user, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'שגיאת שרת פנימית בזמן התחברות' });
  }
});

// נתיב שינוי סיסמה (מתוך הפרופיל)
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "חסרים נתונים לשנות סיסמה" });
    }

    // 1. שליפת המשתמש ממסד הנתונים
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }

    // 2. השוואת הסיסמה הנוכחית למה שמוצפן כעת ב-DB
    const isMatch = user.password.startsWith('$2b$') 
      ? await bcrypt.compare(currentPassword, user.password) 
      : currentPassword === user.password;
      
    if (!isMatch) {
      return res.status(400).json({ error: "הסיסמה הנוכחית שהוזנה שגויה" });
    }

    // 3. הצפנת הסיסמה החדשה
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 4. דריסת הסיסמה הישנה במסד הנתונים
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({ message: "הסיסמה שונתה בהצלחה!" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: 'שגיאת שרת פנימית בשינוי הסיסמה' });
  }
});

module.exports = router;