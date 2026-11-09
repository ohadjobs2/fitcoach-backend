const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createWorkout = async (userId, workoutData) => {
  // אנחנו משתמשים בנתונים שהגיעו מהבקשה, ומוסיפים להם את ה-userId
  // הערה: וודא שהשדות פה (כמו name, notes וכו') תואמים בדיוק למודל Workout שיצרת ב-schema.prisma
  const newWorkout = await prisma.workout.create({
    data: {
      ...workoutData,
      userId: userId // זה הקישור הקריטי למשתמש שביצע את הפעולה!
    }
  });

  return newWorkout;
};
const getUserWorkouts = async (userId) => {
  const workouts = await prisma.workout.findMany({
    where: { userId: userId }, // מביא רק את האימונים של מי שמחובר
    include: {
      sets: {
        include: {
          exercise: true // שולף גם את פרטי התרגיל (כמו "לחיצת חזה") לתוך כל סט!
        }
      }
    },
    orderBy: { date: 'desc' } // מסדר מהחדש לישן
  });

  return workouts;
};
module.exports = { createWorkout, getUserWorkouts };
