const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. יצירת תוכנית אימונים ותזונה
const generateWorkoutProgram = async (userData) => {
  const { age, gender, height, weight, fitnessGoal, muscleFocus,limitations, workoutsPerWeek, selectedDays } = userData;

 const prompt = `
    You are an elite bodybuilding coach and sports nutritionist.
    Client Data:
    Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Height: ${height}cm.
    Goal: ${fitnessGoal}
    Muscle Focus: ${muscleFocus || "כללי"}
    Limitations / Avoid Exercises: ${limitations || "None"}
    Workouts per week: ${workoutsPerWeek}
    Selected Training Days: ${JSON.stringify(selectedDays || ['sun', 'tue', 'thu', 'fri'])}
    מיפוי הימים: sun=0 (ראשון), mon=1 (שני), tue=2 (שלישי), wed=3 (רביעי), thu=4 (חמישי), fri=5 (שישי), sat=6 (שבת).

    CRITICAL TRAINING RULES (MUST FOLLOW STRICTLY):
    1. BIOMECHANICS & LIMITATIONS: Strictly avoid any exercises that conflict with the client's limitations ("${limitations || "None"}"). Swap them immediately for safe, biomechanically sound alternatives targeting the same muscle group.
    2. EXERCISE ORDER: Always program heavy, multi-joint compound movements first (e.g., Squats, Presses, Rows), and finish with single-joint isolation exercises.
    3. LOGICAL SPLITS: Choose a professional workout split based on frequency. 
       - 2-3 days: Full Body or Upper/Lower.
       - 4 days: Upper/Lower or Push/Pull/Legs/FullBody.
       - 5-6 days: Push/Pull/Legs (PPL).
    4. RECOVERY (48H RULE): NEVER train the same primary muscle group two days in a row. Muscles need 48 hours to recover.
    5. MUSCLE FOCUS HANDLING: Do NOT put the "${muscleFocus}" in every single workout. Place it ONLY in its anatomically correct day and prioritize its volume there.
    6. VOLUME & REP RANGES: 4-6 exercises per workout maximum. Prescribe realistic reps (e.g., 6-8 for strength/compounds, 10-15 for hypertrophy/isolations).
    7. SCHEDULING: ONLY the days matching the "Selected Training Days" array get an active workout (isRest: false). All other days MUST be rest days (isRest: true, type: "מנוחה", calories: 0, time: 0, exercises: []).

    NUTRITION CALCULATION:
    Calculate realistic daily nutrition targets (Calories, Protein, Carbs, Fats, Fiber) based on the client's data (Weight, Height, Gender, Age) and the Goal (${fitnessGoal}).

    OUTPUT FORMAT:
    Return ONLY a pure JSON object. NO markdown formatting, NO backticks (\`\`\`), NO intro text. The JSON MUST exact match this structure, with texts/names in Hebrew:
    {
      "weeklyPlan": [
        { 
          "index": 0, "day": "א'", "name": "ראשון", "type": "שם האימון (למשל: פלג גוף עליון)", "calories": 320, "time": 50, "isRest": false, "isDone": false,
          "exercises": [
            { "name": "שם התרגיל", "sets": 4, "reps": "8-10", "muscle": "קבוצת שריר" }
          ]
        },
        { "index": 1, "day": "ב'", "name": "שני", "type": "מנוחה", "calories": 0, "time": 0, "isRest": true, "isDone": false, "exercises": [] }
        // ... (Generate exactly 7 days from index 0 to 6)
      ],
      "nutrition": {
        "calories": { "current": 0, "target": 2600 },
        "protein": { "current": 0, "target": 170 },
        "carbs": { "current": 0, "target": 280 },
        "fat": { "current": 0, "target": 75 },
        "fiber": { "current": 0, "target": 35 }
      }
    }
  `;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating program from Gemini:", error);
    throw new Error("Failed to generate AI program");
  }
};
const generateDietPlan = async (calories, protein, ingredients) => {
  try {
    // השתמש במודל הקיים שלך
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 
    
    const prompt = `
      You are an elite sports nutritionist. 
      Create a 1-day meal plan in Hebrew to help a fitness client hit their exact daily macros.
      
      Target Calories: ${calories} kcal.
      Target Protein: ${protein}g.
      Available Ingredients at home: ${ingredients || "None specified. Build a realistic, healthy plan from scratch."}

      RULES:
      1. If ingredients are provided, build the meals primarily around them. Suggest additional basic grocery items only if strictly necessary to hit the macros.
      2. Divide the day into 3-4 clear meals (Breakfast, Lunch, Dinner, Snack).
      3. Next to each meal, write the estimated calories and protein.
      4. Write a short concluding sentence with a simple grocery list if they need to buy anything extra.
      5. Output ONLY clean, well-formatted text in Hebrew with nice emojis. DO NOT output JSON.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Diet Generation Error:", error);
    throw error;
  }
};
// 2. ניתוח ארוחה חופשית וחישוב ערכים תזונתיים באמצעות AI
const analyzeMealDescription = async (mealDescription) => {
  const prompt = `
    אתה תזונאי קליני וספורט מומחה.
    המשתמש תיאר את הארוחה הבאה שהוא אכל: "${mealDescription}"
    
    חשב בצורה המדויקת ביותר את הערכים התזונתיים של כל מה שמתואר בארוחה הזו (בקלוריות ובגרמים, מספרים שלמים בלבד).
    תן גם שם קצר ומסודר לארוחה בשדה name.
    החזר אובייקט JSON טהור בלבד, ללא שום טקסט נוסף, ללא markdown וללא הערות, בדיוק במבנה הבא:
    {
      "name": "שם קצר לארוחה",
      "calories": 450,
      "protein": 35,
      "carbs": 40,
      "fat": 12,
      "fiber": 5
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing meal from Gemini:", error);
    throw new Error("Failed to analyze meal with AI");
  }
};

module.exports = { generateWorkoutProgram,generateDietPlan, analyzeMealDescription };