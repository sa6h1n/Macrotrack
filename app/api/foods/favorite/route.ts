import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("food_favorites")
    .select("food_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((row) => row.food_id));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const foodId = typeof body?.foodId === "string" ? body.foodId : "";

  if (!foodId) {
    return NextResponse.json({ message: "Food id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("food_favorites").upsert({
    user_id: user.id,
    food_id: foodId,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const foodId = typeof body?.foodId === "string" ? body.foodId : "";

  if (!foodId) {
    return NextResponse.json({ message: "Food id is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("food_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("food_id", foodId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
