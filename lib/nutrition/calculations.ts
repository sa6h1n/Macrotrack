import type { DailyTotals, Food, Nutrients } from "@/types/domain";

export type Per100gFood = Pick<
  Food,
  "calories" | "protein" | "carbs" | "fat" | "fiber"
>;

const round = (value: number, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export function calculateNutrition(food: Per100gFood, grams: number): Nutrients {
  if (!Number.isFinite(grams) || grams <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const multiplier = grams / 100;
  return {
    calories: round(food.calories * multiplier, 0),
    protein: round(food.protein * multiplier),
    carbs: round(food.carbs * multiplier),
    fat: round(food.fat * multiplier),
    fiber: round(food.fiber * multiplier)
  };
}

export function sumNutrition(items: Nutrients[]): DailyTotals {
  return items.reduce<DailyTotals>(
    (totals, item) => ({
      calories: round(totals.calories + item.calories, 0),
      protein: round(totals.protein + item.protein),
      carbs: round(totals.carbs + item.carbs),
      fat: round(totals.fat + item.fat),
      fiber: round(totals.fiber + item.fiber)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function calculateRecipePer100g(
  ingredients: Array<{ nutrients: Nutrients }>,
  totalCookedWeight: number
): Nutrients {
  if (!Number.isFinite(totalCookedWeight) || totalCookedWeight <= 0) {
    throw new Error("Cooked recipe weight must be greater than zero.");
  }

  const total = sumNutrition(ingredients.map((ingredient) => ingredient.nutrients));
  return {
    calories: round((total.calories / totalCookedWeight) * 100, 1),
    protein: round((total.protein / totalCookedWeight) * 100),
    carbs: round((total.carbs / totalCookedWeight) * 100),
    fat: round((total.fat / totalCookedWeight) * 100),
    fiber: round((total.fiber / totalCookedWeight) * 100)
  };
}

export function calculateGoalProgress(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.round((value / target) * 100);
}
