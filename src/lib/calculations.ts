/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
 * where s = +5 for males and -161 for females
 */
export function calculateBMR(
  heightInches: number,
  weightLbs: number,
  age: number,
  sex: string
): number {
  // Convert to metric
  const heightCm = heightInches * 2.54;
  const weightKg = weightLbs * 0.453592;

  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  
  if (sex.toUpperCase() === 'MALE' || sex.toUpperCase() === 'M') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return Math.round(bmr * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Total Daily Energy Expenditure based on activity level
 */
export function calculateTDEE(bmr: number, activityLevel: number): number {
  const activityMultipliers: { [key: number]: number } = {
    1: 1.2,      // Sedentary - Little or no exercise
    2: 1.375,    // Light - Light exercise 1-3 days/week
    3: 1.55,     // Moderate - Moderate exercise 3-5 days/week
    4: 1.725,    // Active - Heavy exercise 6-7 days/week
    5: 1.9       // Very Active - Very heavy exercise, physical job
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;
  
  return Math.round(tdee * 100) / 100; // Round to 2 decimal places
}
