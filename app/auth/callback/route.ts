import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/app";

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(
          "This verification link is invalid or has expired."
        )}`,
        url.origin
      )
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(
          "This verification link is invalid or has expired. Please request a new one."
        )}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}