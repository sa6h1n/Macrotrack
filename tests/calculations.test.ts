import { describe, expect, it } from "vitest";
import { calculateGoalProgress, calculateNutrition, calculateRecipePer100g, sumNutrition } from "@/lib/nutrition/calculations";

const chicken = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 };
describe("calculateNutrition", () => {
  it.each([[50, 83, 15.5], [100, 165, 31], [150, 248, 46.5], [65.5, 108, 20.3]])("calculates %ig servings", (grams, calories, protein) => { const result = calculateNutrition(chicken, grams); expect(result.calories).toBe(calories); expect(result.protein).toBe(protein); });
  it("rejects a zero or negative quantity", () => { expect(() => calculateNutrition(chicken, 0)).toThrow("greater than zero"); expect(() => calculateNutrition(chicken, -5)).toThrow("greater than zero"); });
});
describe("recipe calculations", () => { it("calculates per-100g then serving nutrition", () => { const per100 = calculateRecipePer100g([{ nutrients: { calories: 600, protein: 30, carbs: 40, fat: 20, fiber: 10 } }, { nutrients: { calories: 150, protein: 4, carbs: 20, fat: 5, fiber: 3 } }], 500); expect(per100.calories).toBe(150); expect(calculateNutrition(per100, 80).calories).toBe(120); }); });
describe("daily totals and goals", () => { it("sums stored snapshots and avoids invalid targets", () => { expect(sumNutrition([{ calories: 100, protein: 10, carbs: 12, fat: 3, fiber: 2 }, { calories: 200, protein: 20, carbs: 22, fat: 7, fiber: 4 }])).toEqual({ calories: 300, protein: 30, carbs: 34, fat: 10, fiber: 6 }); expect(calculateGoalProgress(50, 0)).toBe(0); }); });
