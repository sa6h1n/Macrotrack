"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full cursor-pointer rounded-lg bg-moss-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-moss-700 focus:outline-none focus:ring-2 focus:ring-moss-500/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingText : children}
    </button>
  );
}