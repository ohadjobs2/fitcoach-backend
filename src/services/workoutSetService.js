const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSet = async (setData) => {
  // setData יכיל את החזרות, המשקל, וה-IDs של האימון והתרגיל
  const newSet = await prisma.workoutSet.create({
    data: setData
  });
  return newSet;
};

module.exports = { createSet };