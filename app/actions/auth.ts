"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://macrotrack-ashy.vercel.app";

function getSafeNext(value: FormDataEntryValue | null) {
  const next = String(value || "/app");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const safeNext = getSafeNext(formData.get("next"));

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Unable to sign in. Check your email and password."
      )}&next=${encodeURIComponent(safeNext)}`
    );
  }

  redirect(safeNext);
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const safeNext = getSafeNext(formData.get("next"));

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(
        safeNext
      )}`,
    },
  });

  if (error) {
    redirect(
      `/signup?message=${encodeURIComponent(
        "Unable to create your account. Try a different email."
      )}&next=${encodeURIComponent(safeNext)}`
    );
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Check your email to confirm your account."
    )}&next=${encodeURIComponent(safeNext)}`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/update-password`,
  });

  redirect(
    "/forgot-password?message=If an account exists, a reset link has been sent."
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/update-password?message=${encodeURIComponent(
        "Unable to update password. Request another reset link."
      )}`
    );
  }

  redirect("/app");
}