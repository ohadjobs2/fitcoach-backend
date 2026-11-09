const express = require('express');
const cors = require('cors');
require('dotenv').config(); // טוען את קובץ הסודות שלנו

const app = express();
const programRoutes = require('./src/routes/programRoutes');
// הגדרת אמצעי גישור (Middleware)
app.use(cors()); // מאפשר ללקוח (React) לדבר עם השרת שלנו
app.use(express.json()); // מאפשר לשרת לקבל נתונים בפורמט JSON, כמו פרטי הרשמה
const userRoutes = require('./src/routes/userRoutes');
// ייבוא הראוטר של האימונים
const workoutRoutes = require('./src/routes/workoutRoutes');
const exerciseRoutes = require('./src/routes/exerciseRoutes');
const nutritionRoutes = require('./src/routes/nutritionRoutes');
app.use('/api/nutrition', nutritionRoutes);
const mealRoutes = require('./src/routes/mealRoutes');
app.use('/api/meals', mealRoutes);
app.use('/api/exercises', exerciseRoutes);
// הפניית בקשות שמתחילות ב-/api/workouts לראוטר החדש
app.use('/api/workouts', workoutRoutes);
// חיבור הנתב לנתיב הראשי
app.use('/api/users', userRoutes);
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);
// נתיב בדיקה בסיסי כדי לראות שהכל עובד
app.get('/api/status', (req, res) => {
  res.json({ message: 'FitCoach AI Server is running and ready!' });
});
const workoutSetRoutes = require('./src/routes/workoutSetRoutes');
app.use('/api/sets', workoutSetRoutes);
// הגדרת הפורט שעליו השרת יאזין
const PORT = process.env.PORT || 5000;
app.use('/api/programs', programRoutes);
app.listen(PORT, () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 קריסה חמורה שנתפסה:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 שגיאת הבטחה (לרוב חיבור למסד הנתונים שנכשל):', reason);
});
process.on('exit', (code) => {
  console.log(`🛑 השרת החליט להיסגר! קוד יציאה: ${code}`);
});