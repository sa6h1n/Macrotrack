import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({ invitationId: z.string().uuid(), accept: z.boolean() });
export async function POST(request: Request) { try { const { invitationId, accept } = schema.parse(await request.json()); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Your session has expired." }, { status: 401 }); const { error } = await supabase.rpc(accept ? "accept_group_invitation" : "decline_group_invitation", { invitation_id: invitationId }); if (error) return NextResponse.json({ message: "This invitation is no longer available." }, { status: 403 }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ message: "Unable to update this invitation." }, { status: 400 }); } }
