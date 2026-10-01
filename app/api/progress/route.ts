import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const weightSchema = z.object({
  weight: z.number().positive().max(500),
  loggedAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Your session has expired." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("weight_logs")
      .select("id, weight_kg, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { message: "Unable to load weight history." },
        { status: 500 },
      );
    }

    return NextResponse.json({ weights: data ?? [] });
  } catch {
    return NextResponse.json(
      { message: "Unable to load progress data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = weightSchema.parse(await request.json());

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Your session has expired." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("weight_logs")
      .insert({
        user_id: user.id,
        weight_kg: input.weight,
        logged_at: input.loggedAt ?? new Date().toISOString(),
      })
      .select("id, weight_kg, logged_at")
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Unable to save your weight." },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Please enter a valid weight." },
      { status: 400 },
    );
  }
}