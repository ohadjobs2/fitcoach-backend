const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const addMeal = async (mealData) => {
  // 1. השרת מחפש לבד את יומן התזונה האחרון של המשתמש!
  let latestDailyLog = await prisma.dailyNutrition.findFirst({
    where: { userId: mealData.userId },
    orderBy: { id: 'desc' } // מביא את היומן הכי עדכני
  });

  // 2. מכינים את הארוחה לשמירה (בדיוק כמו קודם)
  const mealToCreate = {
    name: mealData.name,
    calories: Number(mealData.calories) || 0,
    protein: Number(mealData.protein) || 0,
    carbs: Number(mealData.carbs) || 0,
    fats: Number(mealData.fat || mealData.fats) || 0,
    fiber: Number(mealData.fiber) || 0,
    description: mealData.description || ""
  };

  if (mealData.id) {
    mealToCreate.id = String(mealData.id);
  }

  // 3. אם השרת מצא יומן - הוא יקשר את הארוחה אליו אוטומטית
  if (latestDailyLog) {
     mealToCreate.dailyNutrition = {
        connect: { id: latestDailyLog.id }
     };
  }

  // 4. יוצרים את הארוחה! 
  const newMeal = await prisma.meal.create({
    data: mealToCreate
  });

  // 5. אם מצאנו יומן, נעדכן גם את הערכים שלו כדי שהגרפים יעבדו
  if (latestDailyLog) {
    await prisma.dailyNutrition.update({
      where: { id: latestDailyLog.id },
      data: {
        totalCalories: { increment: mealToCreate.calories },
        totalProtein: { increment: mealToCreate.protein },
        totalCarbs: { increment: mealToCreate.carbs },
        totalFats: { increment: mealToCreate.fats }
      }
    });
  }

  return newMeal;
};

module.exports = { addMeal };