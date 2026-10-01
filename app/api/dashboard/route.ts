import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  foodId: z.string().uuid(),
  grams: z.number().positive().max(10000),
  meal: z.enum(["breakfast", "lunch", "evening", "dinner", "snack"]),
  measurementState: z.enum(["raw", "cooked", "as_served"]),
  loggedAt: z.string().datetime()
});

export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
    const from = date ? `${date}T00:00:00` : new Date().toISOString().slice(0, 10) + "T00:00:00";
    const to = date ? `${date}T23:59:59.999` : new Date().toISOString().slice(0, 10) + "T23:59:59.999";
    const [{ data: profile, error: profileError }, { data: logs, error: logsError }] = await Promise.all([
      supabase.from("profiles").select("name, email, calorie_target, protein_target, carb_target, fat_target").eq("user_id", user.id).single(),
      supabase.from("food_logs").select("id, food_id, recipe_id, meal, quantity_grams, measurement_state, calories, protein, carbs, fat, fiber, logged_at, foods(name), recipes(name)").gte("logged_at", from).lte("logged_at", to).order("logged_at")
    ]);
    if (profileError || logsError) return NextResponse.json({ message: "Unable to load your dashboard." }, { status: 500 });
    return NextResponse.json({ profile, logs: logs ?? [] });
  } catch {
    return NextResponse.json({ message: "Unable to load your dashboard." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = payloadSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
    const { data: food, error: foodError } = await supabase.from("foods").select("id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, measurement_state").eq("id", input.foodId).single();
    if (foodError || !food) return NextResponse.json({ message: "Food could not be found." }, { status: 404 });
    if (food.measurement_state !== input.measurementState) return NextResponse.json({ message: "Raw and cooked nutrition cannot be mixed. Select the matching food state." }, { status: 422 });
    const multiplier = input.grams / 100;
    const { data: log, error } = await supabase.from("food_logs").insert({ user_id: user.id, food_id: food.id, meal: input.meal, quantity_grams: input.grams, measurement_state: input.measurementState, calories: Math.round(food.calories_per_100g * multiplier), protein: Number((food.protein_per_100g * multiplier).toFixed(1)), carbs: Number((food.carbs_per_100g * multiplier).toFixed(1)), fat: Number((food.fat_per_100g * multiplier).toFixed(1)), fiber: Number((food.fiber_per_100g * multiplier).toFixed(1)), logged_at: input.loggedAt }).select().single();
    if (error) return NextResponse.json({ message: "Unable to save this meal." }, { status: 500 });
    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Please check the food quantity and try again." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing log." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
    const { error } = await supabase.from("food_logs").delete().eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ message: "Unable to remove this meal." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to remove this meal." }, { status: 500 });
  }
}
