import type { Food } from "@/types/domain";

// Approximate generic values per 100g. Replace or supplement with verified provider data.
export const seedFoods: Food[] = [
  { id: "egg-cooked", name: "Egg", foodType: "generic", measurementState: "cooked", source: "USDA", calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, isGlobal: true },
  { id: "chicken-raw", name: "Chicken Breast", foodType: "generic", measurementState: "raw", source: "USDA", calories: 120, protein: 22.5, carbs: 0, fat: 2.6, fiber: 0, isGlobal: true },
  { id: "chicken-cooked", name: "Chicken Breast", foodType: "generic", measurementState: "cooked", source: "USDA", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, isGlobal: true },
  { id: "rice-white", name: "White Rice", foodType: "generic", measurementState: "cooked", source: "USDA", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, isGlobal: true },
  { id: "rice-matta", name: "Kerala Matta Rice", foodType: "generic", measurementState: "cooked", source: "Custom", calories: 125, protein: 2.6, carbs: 26.1, fat: 0.8, fiber: 1.6, isGlobal: true },
  { id: "banana", name: "Banana", foodType: "generic", measurementState: "as_served", source: "USDA", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, isGlobal: true },
  { id: "kiwi", name: "Kiwi", foodType: "generic", measurementState: "as_served", source: "USDA", calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, isGlobal: true },
  { id: "avocado", name: "Avocado", foodType: "generic", measurementState: "as_served", source: "USDA", calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, isGlobal: true },
  { id: "curd", name: "Curd", foodType: "generic", measurementState: "as_served", source: "USDA", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, isGlobal: true },
  { id: "milk", name: "Milk", foodType: "generic", measurementState: "as_served", source: "USDA", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, isGlobal: true },
  { id: "oats", name: "Oats", foodType: "generic", measurementState: "raw", source: "USDA", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, isGlobal: true }
];
