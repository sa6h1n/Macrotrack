"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const next = String(formData.get("next") || "/app");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?message=${encodeURIComponent("Unable to sign in. Check your email and password.")}&next=${encodeURIComponent(safeNext)}`);
  redirect(safeNext);
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const next = String(formData.get("next") || "/app");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(safeNext)}` }
  });
  if (error) redirect(`/signup?message=${encodeURIComponent("Unable to create your account. Try a different email.")}&next=${encodeURIComponent(safeNext)}`);
  redirect(`/login?message=Check your email to confirm your account.&next=${encodeURIComponent(safeNext)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://macrotrack-8fqderba0-macrotrack1.vercel.app";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
  });

  redirect("/forgot-password?message=If an account exists, a reset link has been sent.");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/update-password?message=${encodeURIComponent("Unable to update password. Request another reset link.")}`);
  redirect("/app");
}
