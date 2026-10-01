import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  brand: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  measurementState: z.enum(["raw", "cooked", "as_served"]),
  source: z.enum(["USDA", "OpenFoodFacts"]),
  sourceId: z.string().trim().min(1).max(120),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });

    const { data: existingBySource } = await supabase
      .from("foods")
      .select("id,name,brand,description,food_type,measurement_state,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fiber_per_100g,source,is_global,source_id")
      .eq("source", input.source)
      .eq("source_id", input.sourceId)
      .eq("created_by", user.id)
      .maybeSingle();

    if (existingBySource) return NextResponse.json(existingBySource);

    const { data: existingMatch } = await supabase
      .from("foods")
      .select("id,name,brand,description,food_type,measurement_state,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fiber_per_100g,source,is_global,source_id")
      .eq("created_by", user.id)
      .eq("name", input.name)
      .eq("measurement_state", input.measurementState)
      .eq("source", input.source)
      .limit(1)
      .maybeSingle();

    if (existingMatch) return NextResponse.json(existingMatch);

    const { data, error } = await supabase
      .from("foods")
      .insert({
        name: input.name,
        brand: input.brand ?? null,
        description: input.description ?? null,
        food_type: "branded",
        measurement_state: input.measurementState,
        calories_per_100g: input.calories,
        protein_per_100g: input.protein,
        carbs_per_100g: input.carbs,
        fat_per_100g: input.fat,
        fiber_per_100g: input.fiber,
        source: input.source,
        source_id: input.sourceId,
        created_by: user.id,
        is_global: false,
      })
      .select("id,name,brand,description,food_type,measurement_state,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fiber_per_100g,source,is_global,source_id")
      .single();

    if (error || !data) return NextResponse.json({ message: "Unable to add this API food to your library." }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to add this food." }, { status: 400 });
  }
}
