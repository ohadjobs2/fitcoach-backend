const userService = require('../services/userService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- פונקציית הרשמה ---
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide all required fields (email, password)" });
    }

    const result = await userService.register(req.body);

    res.status(201).json({ 
        success: true, 
        message: "User registered successfully!",
        token: result.token,
        user: {
            id: result.user.id,
            email: result.user.email
        }
    });

  } catch (error) {
    console.error("Error in registerUser:", error.message);
    if (error.message === "User with this email already exists") {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// --- פונקציית התחברות ---
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const result = await userService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email
      }
    });

  } catch (error) {
    console.error("Error in loginUser:", error.message);
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error during login" });
  }
};

// --- בקשת איפוס סיסמה (שליחת המייל) ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "נא לספק אימייל" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: "לא נמצא משתמש עם האימייל הזה" });
    }

    // יצירת טוקן איפוס אקראי
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // שמירת הטוקן במסד הנתונים עם תוקף ל-10 דקות
    await prisma.user.update({
      where: { email: user.email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    // יצירת תוכן המייל
    const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;
    const message = `ביקשת לאפס את הסיסמה שלך באפליקציית FitCoach.\n\nאנא לחץ על הקישור הבא לאיפוס הסיסמה:\n${resetUrl}\n\nאם לא ביקשת לאפס סיסמה, התעלם ממייל זה.`;

    await sendEmail({
      email: user.email,
      subject: 'איפוס סיסמה - FitCoach',
      message: message
    });

    res.status(200).json({ success: true, message: 'המייל נשלח בהצלחה' });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: 'שגיאה בשליחת המייל' });
  }
};

// --- עדכון הסיסמה בפועל ---
const resetPassword = async (req, res) => {
  try {
    const resetToken = req.params.resettoken;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "נא לספק סיסמה חדשה" });
    }
    
    // חיפוש משתמש לפי הטוקן שטרם פג תוקפו
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: { gt: new Date() } // תוקף גדול מעכשיו
      }
    });

    if (!user) {
      return res.status(400).json({ message: "טוקן איפוס לא תקין או שפג תוקפו" });
    }

    // הצפנת הסיסמה החדשה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // עדכון הסיסמה ומחיקת הטוקן
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: 'שגיאה בעדכון הסיסמה' });
  }
};
// --- שינוי סיסמה מתוך פרופיל המשתמש ---
const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "נא לספק את כל הנתונים הנדרשים" });
    }

    // 1. חילוץ המשתמש ממסד הנתונים
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "משתמש לא נמצא" });
    }

    // 2. השוואת הסיסמה הנוכחית למה שמוצפן כעת ב-DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "הסיסמה הנוכחית שהוזנה שגויה" });
    }

    // 3. הצפנת הסיסמה החדשה
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 4. דריסת הסיסמה הישנה ושמירה במסד הנתונים
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({ success: true, message: "הסיסמה שונתה בהצלחה!" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "שגיאה בשינוי הסיסמה" });
  }
};

// עדכון הייצוא בסוף הקובץ כדי שיכלול את הפונקציה החדשה:
module.exports = { registerUser, loginUser, forgotPassword, resetPassword, changePassword };
