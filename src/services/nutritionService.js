const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDailyLog = async (nutritionData) => {
  const newLog = await prisma.dailyNutrition.create({
    data: nutritionData
  });
  return newLog;
};
const getTodayLog = async (userId) => {
  const log = await prisma.dailyNutrition.findFirst({
    where: { userId: userId },
    orderBy: { date: 'desc' }, // מביא את היומן האחרון שנוצר
    include: {
      meals: true // שולף גם את רשימת הארוחות שאכלת
    }
  });
  return log;
};

module.exports = { createDailyLog, getTodayLog };