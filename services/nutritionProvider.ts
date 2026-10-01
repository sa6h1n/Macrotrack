import type { Food } from "@/types/domain";

export interface NutritionProvider {
  search(query: string): Promise<Food[]>;
}

export class UsdaNutritionProvider implements NutritionProvider {
  async search(query: string): Promise<Food[]> {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey || query.trim().length < 2) return [];
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=8`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const result = await response.json() as { foods?: Array<{ fdcId: number; description: string; brandOwner?: string; foodNutrients?: Array<{ nutrientName: string; value: number }> }> };
    return (result.foods ?? []).map((item) => {
      const nutrient = (name: string) => item.foodNutrients?.find((entry) => entry.nutrientName === name)?.value ?? 0;
      return { id: `usda-${item.fdcId}`, name: item.description, brand: item.brandOwner, foodType: "generic", measurementState: "as_served", source: "USDA", calories: nutrient("Energy"), protein: nutrient("Protein"), carbs: nutrient("Carbohydrate, by difference"), fat: nutrient("Total lipid (fat)"), fiber: nutrient("Fiber, total dietary") };
    });
  }
}
