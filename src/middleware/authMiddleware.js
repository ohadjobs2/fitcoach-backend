const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // 1. בודקים אם הבקשה מכילה כותרת Authorization שמתחילה במילה Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. מחלצים את הטוקן עצמו (חותכים את המילה Bearer והרווח שאחריה)
      token = req.headers.authorization.split(' ')[1];

      // 3. מפענחים ומאמתים את הטוקן בעזרת המפתח הסודי שלנו
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

      // 4. מדביקים את פרטי המשתמש (מה שהצפנו בטוקן) לתוך אובייקט הבקשה
      // ככה כל קונטרולר שיבוא אחרי ה-Middleware הזה ידע בדיוק מי המשתמש!
      req.user = decoded;

      // 5. הכל תקין - נותנים לבקשה להמשיך הלאה ליעד שלה
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // אם בכלל לא נשלח טוקן בבקשה
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };