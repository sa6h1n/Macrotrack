export type MeasurementState = "raw" | "cooked" | "as_served";
export type Meal = "breakfast" | "lunch" | "evening" | "dinner" | "snack";
export type Goal = "maintain" | "lose" | "gain";

export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Food extends Nutrients {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  foodType: "generic" | "branded" | "custom" | "recipe";
  measurementState: MeasurementState;
  source: "USDA" | "OpenFoodFacts" | "NutritionLabel" | "Custom" | "Recipe";
  isGlobal?: boolean;
  sourceId?: string | null;
  persisted?: boolean;
}

export interface FoodLog extends Nutrients {
  id: string;
  foodId?: string | null;
  recipeId?: string | null;
  foodName: string;
  meal: Meal;
  quantityGrams: number;
  measurementState: MeasurementState;
  loggedAt: string;
}

export type DailyTotals = Nutrients;

export interface Profile {
  id: string;
  name: string;
  email: string;
  memberId: string;
  avatar: "🐐" | "⚡";
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  goal: Goal;
}

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  evening: "Evening",
  dinner: "Dinner",
  snack: "Snacks"
};
