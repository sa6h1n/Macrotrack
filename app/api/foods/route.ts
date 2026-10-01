import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function fuzzyScore(query: string, food: {
  name: string;
  brand?: string | null;
  description?: string | null;
}): number {
  const q = normalizeSearchText(query);
  const searchable = normalizeSearchText(
    `${food.name} ${food.brand ?? ""} ${food.description ?? ""}`,
  );

  if (!q || !searchable) return 0;
  if (searchable === q) return 10000;
  if (searchable.startsWith(q)) return 9000;
  if (searchable.includes(q)) return 8000;

  const queryWords = q.split(/\s+/).filter(Boolean);
  const targetWords = searchable.split(/\s+/).filter(Boolean);

  let total = 0;

  for (const queryWord of queryWords) {
    if (targetWords.some((word) => word === queryWord)) {
      total += 1000;
      continue;
    }

    if (targetWords.some((word) => word.startsWith(queryWord))) {
      total += 900;
      continue;
    }

    const bestDistance = Math.min(
      ...targetWords.map((word) => levenshtein(queryWord, word)),
    );

    const maxDistance =
      queryWord.length <= 3 ? 0 :
      queryWord.length <= 5 ? 1 :
      queryWord.length <= 8 ? 2 : 3;

    if (bestDistance <= maxDistance) {
      total += 700 - bestDistance * 100;
    }
  }

  // Require every query word to have found a reasonable match.
  if (queryWords.length && total === 0) return 0;

  return total / Math.max(queryWords.length, 1);
}

const foodSelect = "id,name,brand,description,food_type,measurement_state,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fiber_per_100g,source,is_global,source_id";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });

    if (!query) {
      const { data, error } = await supabase
        .from("foods")
        .select(foodSelect)
        .order("name")
        .limit(300);

      if (error) return NextResponse.json({ message: "Unable to load foods." }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    // First use the normal indexed-ish substring search.
    const { data: directRows, error: directError } = await supabase
      .from("foods")
      .select(foodSelect)
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
      .order("name")
      .limit(100);

    if (directError) return NextResponse.json({ message: "Unable to load foods." }, { status: 500 });

    // If the spelling is wrong, the normal query can return nothing.
    // Fetch a bounded catalog and rank it locally with edit-distance matching.
    const { data: catalogRows, error: catalogError } = await supabase
      .from("foods")
      .select(foodSelect)
      .order("name")
      .limit(2000);

    if (catalogError) return NextResponse.json({ message: "Unable to load foods." }, { status: 500 });

    const directIds = new Set((directRows ?? []).map((row) => row.id));

    const ranked = (catalogRows ?? [])
      .map((food) => ({
        food,
        score: fuzzyScore(query, food),
        direct: directIds.has(food.id),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (a.direct !== b.direct) return a.direct ? -1 : 1;
        return b.score - a.score;
      })
      .slice(0, 20)
      .map((item) => item.food);

    return NextResponse.json(ranked);
  } catch {
    return NextResponse.json({ message: "Unable to load foods." }, { status: 500 });
  }
}

const foodSchema = z.object({ name: z.string().trim().min(1).max(120), brand: z.string().trim().max(120).optional().nullable(), description: z.string().trim().max(500).optional().nullable(), measurementState: z.enum(["raw", "cooked", "as_served"]), calories: z.number().min(0), protein: z.number().min(0), carbs: z.number().min(0), fat: z.number().min(0), fiber: z.number().min(0) });

export async function POST(request: Request) {
  try { const input = foodSchema.parse(await request.json()); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 }); const { data, error } = await supabase.from("foods").insert({ name: input.name, brand: input.brand, description: input.description, measurement_state: input.measurementState, calories_per_100g: input.calories, protein_per_100g: input.protein, carbs_per_100g: input.carbs, fat_per_100g: input.fat, fiber_per_100g: input.fiber, food_type: "custom", source: "NutritionLabel", created_by: user.id, is_global: false }).select().single(); if (error) return NextResponse.json({ message: "Unable to save your food." }, { status: 500 }); return NextResponse.json(data, { status: 201 }); } catch { return NextResponse.json({ message: "Check the nutrition values and try again." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try { const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ message: "Missing food." }, { status: 400 }); const input = foodSchema.parse(await request.json()); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 }); const { data, error } = await supabase.from("foods").update({ name: input.name, brand: input.brand, description: input.description, measurement_state: input.measurementState, calories_per_100g: input.calories, protein_per_100g: input.protein, carbs_per_100g: input.carbs, fat_per_100g: input.fat, fiber_per_100g: input.fiber }).eq("id", id).eq("created_by", user.id).eq("is_global", false).select().single(); if (error || !data) return NextResponse.json({ message: "Unable to update this food." }, { status: 403 }); return NextResponse.json(data); } catch { return NextResponse.json({ message: "Check the nutrition values and try again." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try { const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ message: "Missing food." }, { status: 400 }); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 }); const { error } = await supabase.from("foods").delete().eq("id", id).eq("created_by", user.id).eq("is_global", false); if (error) return NextResponse.json({ message: "Unable to remove this food." }, { status: 500 }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ message: "Unable to remove this food." }, { status: 500 }); }
}
