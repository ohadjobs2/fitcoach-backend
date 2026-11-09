const aiService = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// פונקציית עזר חסינת-קריסות: מנסה לשלוף משתמש, ואם מסד הנתונים ישן או לא זמין - ממשיכה בלי להפיל את השרת
const getUserId = async (req) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  try {
    const firstUser = await prisma.user.findFirst();
    return firstUser ? firstUser.id : null;
  } catch (dbError) {
    console.warn("⚠️ מסד הנתונים (Neon) מתעורר או לא זמין כרגע, ממשיך להציג את תוכנית ה-AI למסך...");
    return null;
  }
};

// --- 1. יצירת תוכנית AI ---
// --- 1. יצירת תוכנית AI ---
const generateAiProgram = async (req, res) => {
  try {
    // הוספנו פה את userId כדי למשוך אותו מהפרונטאנד באופן מפורש!
    const { userId, age, gender, weight, height, fitnessGoal, muscleFocus, limitations, workoutsPerWeek, availableDays } = req.body;
    
    if (!availableDays || !Array.isArray(availableDays) || availableDays.length !== workoutsPerWeek) {
      return res.status(400).json({ message: "נא לספק את הימים הפנויים לאימון (availableDays)" });
    }

    if (!age || !weight || !workoutsPerWeek) {
      return res.status(400).json({ message: "נא לספק את כל הנתונים הפיזיולוגיים ליצירת התוכנית" });
    }

    // 1. שולחים את הנתונים ל-Gemini ומקבלים תוכנית
    const aiProgram = await aiService.generateWorkoutProgram({
      ...req.body,
      selectedDays: availableDays
    });

    // 2. שמירה ל-Prisma (עכשיו זה נשמר בטוח)
    let savedProgram = null;
    // משתמש ב-ID שהגיע מהריאקט, ואם אין - משתמש בפונקציית העזר
    const actualUserId = userId || await getUserId(req); 

    if (actualUserId) {
      savedProgram = await prisma.program.create({
        data: {
          name: aiProgram.programName || `תוכנית ${fitnessGoal}`,
          description: aiProgram.description || "נבנה על ידי FitCoach AI",
          isAi: true,
          userId: actualUserId,
          // הוספנו שמירה מפורשת של ה-weeklyPlan למסד הנתונים כדי ש-finishWorkout ימצא אותו
          weeklyPlan: aiProgram.weeklyPlan,
          
          // אם ה-AI במקרה החזיר גם את מבנה ה-workouts, נשמור גם אותו
          ...(aiProgram.workouts && Array.isArray(aiProgram.workouts) ? {
            workouts: {
              create: aiProgram.workouts.map((workout, index) => ({
                name: workout.name,
                dayOfWeek: availableDays[index],
                userId: actualUserId,
                exercises: {
                  create: (workout.exercises || []).map(ex => ({
                    name: ex.name,
                    isCustom: true,
                    sets: {
                      create: Array.from({ length: ex.sets || 3 }).map(() => ({
                        reps: ex.reps || 10,
                        weight: 0
                      }))
                    }
                  }))
                }
              }))
            }
          } : {})
        }
      });
    }

    // 3. מחזירים ל-React 
    res.status(201).json({ 
      success: true, 
      weeklyPlan: aiProgram.weeklyPlan, 
      nutrition: aiProgram.nutrition,
      program: savedProgram 
    });

  } catch (error) {
    console.error("Error generating program:", error);
    res.status(500).json({ message: "שגיאה ביצירת התוכנית מול ה-AI" });
  }
};

// --- 2. יצירת תוכנית ידנית (קנבס ריק) ---
// --- 2. יצירת תוכנית ידנית (קנבס ריק) ---
const createManualProgram = async (req, res) => {
  try {
    // משכנו פה את ה-userId וגם את ה-weeklyPlan (אם הפרונטאנד שולח תוכנית מוכנה)
    const { userId, name, description, weeklyPlan } = req.body;
    
    // מוודאים שאנחנו משתמשים ב-ID מהפרונטאנד
    const actualUserId = userId || await getUserId(req);

    if (!name) {
      return res.status(400).json({ message: "חובה לספק שם לתוכנית" });
    }
    if (!actualUserId) {
      return res.status(401).json({ message: "לא נמצא משתמש לשמירת התוכנית" });
    }

    const newProgram = await prisma.program.create({
      data: {
        name,
        description: description || "",
        isAi: false,
        userId: actualUserId,
        // מאתחלים את התוכנית השבועית. חובה כדי ש-finishWorkout תוכל לסמן V בהמשך!
        weeklyPlan: weeklyPlan || []
      }
    });

    res.status(201).json({ success: true, program: newProgram });
  } catch (error) {
    console.error("Error creating manual program:", error);
    res.status(500).json({ message: "שגיאה ביצירת התוכנית הידנית" });
  }
};

// --- 3. הוספת אימון (ותרגילים) לתוכנית קיימת ---
// --- 3. הוספת אימון (ותרגילים) לתוכנית קיימת ---
const addManualWorkout = async (req, res) => {
  try {
    const { programId } = req.params;
    // 1. הוספנו פה את שליפת ה-userId מהבקשה!
    const { userId, name, exercises, dayOfWeek } = req.body; 
    
    // 2. מוודאים שמשתמשים ב-ID הנכון
    const actualUserId = userId || await getUserId(req);

    if (!name || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ message: "נא לספק שם לאימון ורשימת תרגילים תקינה" });
    }
    if (!actualUserId) {
      return res.status(401).json({ message: "לא נמצא משתמש" });
    }

    const newWorkout = await prisma.workout.create({
      data: {
        name,
        dayOfWeek,
        userId: actualUserId, // 3. מעבירים את ה-ID האמיתי למסד הנתונים
        programId: programId,
        exercises: {
          create: exercises.map(ex => ({
            name: ex.name,
            isCustom: true,
            sets: {
              create: Array.from({ length: ex.sets }).map(() => ({
                reps: ex.reps,
                weight: 0
              }))
            }
          }))
        }
      },
      include: {
        exercises: {
          include: { sets: true }
        }
      }
    });

    res.status(201).json({ success: true, workout: newWorkout });
  } catch (error) {
    console.error("Error adding manual workout:", error);
    res.status(500).json({ message: "שגיאה בהוספת האימון והתרגילים" });
  }
};
const generateDiet = async (req, res) => {
  try {
    const { calories, protein, ingredients } = req.body;
    
    if (!calories || !protein) {
      return res.status(400).json({ message: "חסרים נתוני קלוריות או חלבון" });
    }

    const dietPlan = await aiService.generateDietPlan(calories, protein, ingredients);
    res.status(200).json({ dietPlan });
  } catch (error) {
    console.error("Error generating diet:", error);
    res.status(500).json({ error: "שגיאה בייצור התפריט מול ה-AI" });
  }
};
// --- 4. שליפת כל התוכניות של המשתמש המחובר ---
const getUserPrograms = async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(200).json({ success: true, programs: [] });
    }

    const programs = await prisma.program.findMany({
      where: { userId: userId },
      include: {
        workouts: {
          include: {
            exercises: {
              include: { sets: true }
            }
          }
        }
      }
    });

    res.status(200).json({ success: true, programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "שגיאה בשליפת התוכניות" });
  }
};

// --- 5. שליפת האימון של היום ---
const getTodayWorkout = async (req, res) => {
  try {
    const today = new Date().getDay();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(200).json({ success: true, workout: null });
    }

    const workout = await prisma.workout.findFirst({
      where: {
        userId: userId,
        dayOfWeek: today
      },
      include: {
        exercises: {
          include: { sets: true }
        }
      }
    });

    if (!workout) {
      return res.status(200).json({ 
        success: true, 
        message: "אין לך אימון מתוכנן להיום. זמן טוב להתאושש!", 
        workout: null 
      });
    }

    res.status(200).json({ success: true, workout });
  } catch (error) {
    console.error("Error fetching today's workout:", error);
    res.status(500).json({ message: "שגיאה בשליפת האימון היומי" });
  }
};

// --- 6. עדכון סט בזמן אימון (Log Set) ---
const logSet = async (req, res) => {
  try {
    const { setId } = req.params;
    const { weight, reps } = req.body;

    if (weight === undefined) {
      return res.status(400).json({ message: "נא להזין משקל לסט" });
    }

    const updatedSet = await prisma.set.update({
      where: { id: setId },
      data: {
        weight: Number(weight),
        ...(reps !== undefined && { reps: Number(reps) }) 
      }
    });

    res.status(200).json({ success: true, set: updatedSet });
  } catch (error) {
    console.error("Error updating set:", error);
    res.status(500).json({ message: "שגיאה בעדכון הסט" });
  }
};

// --- 7. מחיקת תוכנית ---
const deleteProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = await getUserId(req);

    const program = await prisma.program.findUnique({ where: { id: programId } });
    
    if (!program) {
      return res.status(404).json({ message: "התוכנית לא נמצאה" });
    }
    
    if (userId && program.userId !== userId) {
      return res.status(403).json({ message: "אין לך הרשאה למחוק את התוכנית הזו" });
    }

    await prisma.program.delete({
      where: { id: programId }
    });

    res.status(200).json({ success: true, message: "התוכנית נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "שגיאה במחיקת התוכנית" });
  }
};
// --- 8. ניתוח ארוחה באמצעות AI ---
const analyzeMeal = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "נא לתאר מה אכלת" });
    }

    const mealData = await aiService.analyzeMealDescription(description);
    res.status(200).json({ success: true, meal: mealData });
  } catch (error) {
    console.error("Error analyzing meal:", error);
    res.status(500).json({ message: "שגיאה בניתוח הארוחה מול ה-AI" });
  }
};


const getExerciseProgress = async (req, res) => {
  try {
    const { userId, exercise } = req.params;
    
    const logs = await prisma.progressLog.findMany({
      where: { userId, exercise },
      orderBy: { date: 'asc' }
    });

    // המרה לפורמט של הגרף: { date: "15 אוק׳", weight: 80 }
    const chartData = logs.map(log => ({
      date: new Date(log.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
      weight: log.weight
    }));

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "שגיאה בשליפת סטטיסטיקות" });
  }
};
const logExerciseProgress = async (req, res) => {
  try {
    const { userId, exercise, weight } = req.body;
    
    if (!userId || !exercise || weight === undefined) {
      return res.status(400).json({ error: "חסרים נתונים לשמירה" });
    }

    const newLog = await prisma.progressLog.create({
      data: {
        userId,
        exercise,
        weight: parseFloat(weight)
      }
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error("Error logging weight:", error);
    res.status(500).json({ error: "שגיאה בשמירת המשקל" });
  }
}; 
const finishWorkout = async (req, res) => {
  try {
    const { userId, dayIndex, exercises } = req.body;

    if (!userId || dayIndex === undefined) {
      return res.status(400).json({ error: "חסרים נתונים לעדכון האימון" });
    }

    // שליפת תוכנית האימונים של המשתמש ממסד הנתונים
    const program = await prisma.program.findFirst({
      where: { userId: userId }
    });

    if (!program) {
      return res.status(404).json({ error: "לא נמצאה תוכנית פעילה" });
    }

    // עדכון הסטטוס של היום הספציפי בתוך התוכנית השבועית
    let updatedWeeklyPlan = program.weeklyPlan;
    
    if (Array.isArray(updatedWeeklyPlan)) {
      updatedWeeklyPlan = updatedWeeklyPlan.map(day => {
        if (day.index === dayIndex) {
          return { 
            ...day, 
            isDone: true,
            // שומרים גם את הסטים שהוזנו כדי שיופיעו בהיסטוריה אם נרצה
            exercises: exercises ? exercises.map(ex => ({ ...ex, loggedSets: ex.liveSets })) : day.exercises
          };
        }
        return day;
      });
    }

    // שמירת התוכנית המעודכנת חזרה ל-Neon DB
    await prisma.program.update({
      where: { id: program.id },
      data: { weeklyPlan: updatedWeeklyPlan }
    });

    res.status(200).json({ message: "האימון עודכן בהצלחה במסד הנתונים" });
  } catch (error) {
    console.error("Error finishing workout:", error);
    res.status(500).json({ error: "שגיאה בשמירת סטטוס האימון" });
  }
};
module.exports = { 
  generateAiProgram, 
  createManualProgram, 
  addManualWorkout, 
  getUserPrograms, 
  getTodayWorkout, 
  logSet, 
  deleteProgram,
  analyzeMeal,
  getExerciseProgress,
  generateDiet,
  logExerciseProgress,
  finishWorkout
};
