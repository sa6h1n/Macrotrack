import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth-card";
import { SubmitButton } from "@/components/submit-button";

export default async function LoginPage({
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

  const isJoinLink = safeNext.startsWith("/join/");

  return (
    <AuthCard
      title="Welcome back"
      description="Log the next meal and keep your own rhythm."
      footer={
        <>
          New here?{" "}
          <Link
            className="font-bold text-moss-700 dark:text-moss-100"
            href={`/signup?next=${encodeURIComponent(safeNext)}`}
          >
            Create an account
          </Link>
        </>
      }
    >
      <form action={signIn} className="space-y-4">
        <input
          type="hidden"
          name="next"
          value={safeNext}
        />

        {message && (
          <div className="rounded-md bg-moss-50 px-3 py-2.5 text-sm font-medium text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">
            <p role="status">{message}</p>

            {isJoinLink &&
              message.includes("Unable to sign in") && (
                <Link
                  href={`/signup?next=${encodeURIComponent(safeNext)}`}
                  className="mt-2 inline-block font-bold underline"
                >
                  Don&apos;t have an account? Create one
                </Link>
              )}
          </div>
        )}

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
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-md border border-[#dce5dc] bg-white px-3 py-3 outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <div className="text-right">
          <Link
            className="text-sm font-bold text-moss-700 dark:text-moss-100"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton
          pendingText="Logging in…"
          className="w-full rounded-lg bg-moss-600 px-4 py-3.5 text-sm font-bold text-white"
        >
          Log in
        </SubmitButton>
      </form>
    </AuthCard>
  );
}