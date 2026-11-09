const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createExercise = async (exerciseData) => {
  const newExercise = await prisma.exercise.create({
    data: exerciseData
  });
  return newExercise;
};

module.exports = { createExercise };