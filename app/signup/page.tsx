import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth-card";
import { SubmitButton } from "@/components/submit-button";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    next?: string;
  }>;
}) {
  const { message, next } = await searchParams;

  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//")
      ? next
      : "/app";

  return (
    <AuthCard
      title="Start tracking simply"
      description="Your meals, targets, and private group in one calm place."
      footer={
        <>
          Already have an account?{" "}
          <Link
            className="font-bold text-moss-700 dark:text-moss-100"
            href={`/login?next=${encodeURIComponent(safeNext)}`}
          >
            Log in
          </Link>
        </>
      }
    >
      <form action={signUp} className="space-y-4">
        <input
          type="hidden"
          name="next"
          value={safeNext}
        />

        {message && (
          <p
            role="status"
            className="rounded-md bg-coral-50 px-3 py-2.5 text-sm font-medium text-coral-500"
          >
            {message}
          </p>
        )}

        <label className="block text-sm font-semibold dark:text-white">
          Name
          <input
            required
            name="name"
            autoComplete="name"
            className="mt-1.5 w-full rounded-md border border-[#dce5dc] bg-white px-3 py-3 outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <label className="block text-sm font-semibold dark:text-white">
          Email
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1.5 w-full rounded-md border border-[#dce5dc] bg-white px-3 py-3 outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <label className="block text-sm font-semibold dark:text-white">
          Password
          <input
            required
            minLength={8}
            name="password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-md border border-[#dce5dc] bg-white px-3 py-3 outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <SubmitButton
          pendingText="Creating account…"
          className="w-full rounded-lg bg-moss-600 px-4 py-3.5 text-sm font-bold text-white"
        >
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
}