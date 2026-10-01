import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatMonth(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <SectionHeading
          eyebrow="Your record"
          title="History"
          description="Your logged meals will appear here."
        />
      </>
    );
  }

  const { data: logs, error } = await supabase
    .from("food_logs")
    .select("calories, protein, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false });

  if (error) {
    return (
      <>
        <SectionHeading
          eyebrow="Your record"
          title="History"
          description="We couldn't load your history right now."
        />
      </>
    );
  }

  const grouped = new Map<
    string,
    { calories: number; protein: number }
  >();

  for (const log of logs ?? []) {
    const dateKey = log.logged_at.slice(0, 10);
    const current = grouped.get(dateKey) ?? { calories: 0, protein: 0 };

    current.calories += Number(log.calories ?? 0);
    current.protein += Number(log.protein ?? 0);
    grouped.set(dateKey, current);
  }

  const days = Array.from(grouped.entries()).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  return (
    <>
      <SectionHeading
        eyebrow="Your record"
        title="History"
        description={
          days.length
            ? "Your logged days are saved here."
            : "Your history will appear here once you log your first meal."
        }
      />

      {days.length ? (
        <div className="mt-7 overflow-hidden rounded-lg border border-[#dfe7df] bg-white shadow-sm dark:border-white/10 dark:bg-[#18201a]">
          {days.map(([dateKey, totals]) => (
            <Link
              href={`/app?date=${dateKey}`}
              key={dateKey}
              className="flex items-center gap-4 border-b border-[#edf1ed] px-4 py-4 last:border-0 hover:bg-[#fafcf9] dark:border-white/10 dark:hover:bg-white/5"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-moss-50 text-center text-xs font-bold text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">
                <span>{formatMonth(dateKey)}</span>
                <span className="-mt-1 text-base">
                  {Number(dateKey.slice(8, 10))}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold">{formatDate(dateKey)}</p>
                <p className="mt-1 text-sm text-[#6c7b70] dark:text-[#aebbb0]">
                  {Math.round(totals.calories).toLocaleString()} kcal · {totals.protein.toFixed(1)}g protein
                </p>
              </div>

              <ChevronRight size={18} className="shrink-0 text-[#93a095]" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-lg border border-dashed border-[#dfe7df] bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-[#18201a]">
          <p className="font-bold">No history yet</p>
          <p className="mt-1 text-sm text-[#6c7b70] dark:text-[#aebbb0]">
            Start logging food from Home and your completed days will appear here.
          </p>
          <Link
            href="/app"
            className="mt-5 inline-flex rounded-md bg-moss-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-moss-700"
          >
            Start logging
          </Link>
        </div>
      )}
    </>
  );
}
