const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const register = async (userData) => {
  const { name, email, password, age, weight, height, gender, fitnessGoal, muscleFocus, workoutsPerWeek } = userData;

  // 1. בדיקה אם כבר יש במערכת משתמש עם האימייל הזה
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // 2. הצפנת הסיסמה של המשתמש בעזרת Bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. שמירת המשתמש החדש במסד הנתונים
  const newUser = await prisma.user.create({
    data: {
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      age,
      weight,
      height,
      gender,
      fitnessGoal,
      muscleFocus,
      workoutsPerWeek
    }
  });

  // 4. יצירת טוקן אימות
  const token = jwt.sign(
    { id: newUser.id },
    process.env.JWT_SECRET || 'fallback_secret_key', 
    { expiresIn: '30d' } 
  );

  return { user: newUser, token };
};

// --- פונקציית ההתחברות ---
const login = async (email, password) => {
  // 1. מחפשים את המשתמש במסד הנתונים לפי האימייל
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. השוואת הסיסמה
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // 3. יצירת טוקן חדש
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '30d' }
  );

  return { user, token };
};

module.exports = { register, login };