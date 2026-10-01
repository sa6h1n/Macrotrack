import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({ weightKg: z.number().positive().max(1000), loggedAt: z.string().datetime() });
export async function POST(request: Request) { try { const input = schema.parse(await request.json()); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 }); const { data, error } = await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: input.weightKg, logged_at: input.loggedAt }).select().single(); if (error) return NextResponse.json({ message: "Unable to save your weight." }, { status: 500 }); return NextResponse.json(data, { status: 201 }); } catch { return NextResponse.json({ message: "Enter a valid positive weight." }, { status: 400 }); } }
