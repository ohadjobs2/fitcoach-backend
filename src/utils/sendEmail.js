const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // יצירת "הדוור" שלנו שמתחבר לשרת של גוגל
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // האימייל שלך
      pass: process.env.EMAIL_PASS  // סיסמת האפליקציה מגוגל
    }
  });

  // הגדרת פרטי ההודעה עצמה
  const mailOptions = {
    from: 'FitCoach AI <noreply@fitcoach.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // שליחת המייל בפועל
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;