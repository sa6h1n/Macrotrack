import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SearchFood = {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  foodType: "generic" | "branded" | "custom" | "recipe";
  measurementState: "raw" | "cooked" | "as_served";
  source: "USDA" | "OpenFoodFacts" | "NutritionLabel" | "Custom" | "Recipe";
  sourceId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  persisted: false;
};

function number(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function searchUsda(query: string): Promise<SearchFood[]> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";

  // USDA's search endpoint is most reliable with GET query parameters.
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const result = await response.json() as {
    foods?: Array<{
      fdcId: number;
      description?: string;
      brandOwner?: string;
      brandName?: string;
      ingredients?: string;
      foodNutrients?: Array<{
        nutrientId?: number;
        nutrientName?: string;
        value?: number;
      }>;
    }>;
  };

  const nutrient = (
    nutrients: Array<{ nutrientId?: number; nutrientName?: string; value?: number }> | undefined,
    ids: number[],
    names: string[],
  ) => {
    const found = nutrients?.find((entry) =>
      (entry.nutrientId != null && ids.includes(entry.nutrientId)) ||
      (entry.nutrientName != null &&
        names.some((name) =>
          entry.nutrientName!.trim().toLowerCase() === name.toLowerCase(),
        )),
    );
    return number(found?.value);
  };

  return (result.foods ?? []).map((item) => {
    const name = item.description?.trim() || "USDA food";
    const normalizedName = name.toLowerCase();

    const measurementState =
      /\bcooked\b|\bboiled\b|\bsteamed\b|\broasted\b|\bbaked\b|\bgrilled\b|\bfried\b/.test(normalizedName)
        ? "cooked"
        : /\braw\b/.test(normalizedName)
          ? "raw"
          : "as_served";

    return {
      id: `usda-${item.fdcId}`,
      sourceId: String(item.fdcId),
      name,
      brand: item.brandOwner || item.brandName || null,
      description: item.ingredients || null,
      foodType: (item.brandOwner || item.brandName ? "branded" : "generic") as SearchFood["foodType"],
      measurementState: measurementState as SearchFood["measurementState"],
      source: "USDA" as SearchFood["source"],
      calories: nutrient(item.foodNutrients, [1008], [
        "Energy",
        "Energy (Atwater General)",
        "Energy (Atwater Specific Factors)",
      ]),
      protein: nutrient(item.foodNutrients, [1003], ["Protein"]),
      carbs: nutrient(item.foodNutrients, [1005], [
        "Carbohydrate, by difference",
        "Carbohydrate",
      ]),
      fat: nutrient(item.foodNutrients, [1004], [
        "Total lipid (fat)",
        "Total lipid",
      ]),
      fiber: nutrient(item.foodNutrients, [1079], [
        "Fiber, total dietary",
      ]),
      persisted: false as const,
    };
  });
}

async function searchOpenFoodFacts(query: string): Promise<SearchFood[]> {
  const url = new URL("https://world.openfoodfacts.org/api/v2/search");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("page_size", "8");
  url.searchParams.set("fields", "code,product_name,brands,ingredients_text,nutriments");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MacroTrack/0.1 (nutrition tracker)",
    },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  const result = await response.json() as {
    products?: Array<{
      code?: string;
      product_name?: string;
      brands?: string;
      ingredients_text?: string;
      nutriments?: Record<string, unknown>;
    }>;
  };

  return (result.products ?? []).map((item) => {
    const n = item.nutriments ?? {};
    return {
      id: `off-${item.code || Math.random().toString(36).slice(2)}`,
      sourceId: item.code || "",
      name: item.product_name?.trim() || "Open Food Facts product",
      brand: item.brands?.split(",")[0]?.trim() || null,
      description: item.ingredients_text || null,
      foodType: "branded" as SearchFood["foodType"],
      measurementState: "as_served" as SearchFood["measurementState"],
      source: "OpenFoodFacts" as SearchFood["source"],
      calories: number(n["energy-kcal_100g"] ?? n["energy-kcal"]),
      protein: number(n.proteins_100g),
      carbs: number(n.carbohydrates_100g),
      fat: number(n.fat_100g),
      fiber: number(n.fiber_100g),
      persisted: false as const,
    };
  }).filter((food) => Boolean(food.sourceId) && Boolean(food.name) && (food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fat > 0));
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) return NextResponse.json([]);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });

    const [usda, off] = await Promise.all([
      searchUsda(query).catch(() => []),
      searchOpenFoodFacts(query).catch(() => []),
    ]);

    return NextResponse.json([...usda, ...off].slice(0, 16));
  } catch {
    return NextResponse.json({ message: "Nutrition search is temporarily unavailable." }, { status: 500 });
  }
}
