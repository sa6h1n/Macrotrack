"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeading } from "@/components/section-heading";

type WeightLog = {
  id: string;
  weight_kg: number;
  logged_at: string;
};

type FoodLog = {
  id: string;
  calories: number;
  protein: number;
  logged_at: string;
};

type ProgressPoint = {
  date: string;
  calories: number | null;
  protein: number | null;
  weight: number | null;
};

const ranges = [
  { label: "7 days", count: 7 },
  { label: "30 days", count: 30 },
  { label: "90 days", count: 90 },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function ChartPanel({
  label,
  dataKey,
  color,
  unit,
  data,
}: {
  label: string;
  dataKey: "calories" | "protein" | "weight";
  color: string;
  unit: string;
  data: ProgressPoint[];
}) {
  const latest = [...data]
    .reverse()
    .find((item) => item[dataKey] !== null)?.[dataKey];

  return (
    <section className="rounded-xl border border-[#e1e4e8] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#181b21] sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">{label}</h2>

        <p
          className="text-sm font-semibold"
          style={{ color }}
        >
          {latest !== null && latest !== undefined
            ? `${Number(latest).toFixed(dataKey === "weight" ? 1 : 0)} ${unit}`
            : "No data"}
        </p>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 8,
              right: 4,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id={`${dataKey}-fill`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={color}
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor={color}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#e4e6ea"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: "#858b95",
              }}
              minTickGap={26}
              tickFormatter={formatDateLabel}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: "#858b95",
              }}
            />

            <Tooltip
              labelFormatter={(value) => formatDateLabel(String(value))}
              formatter={(value) => [
                value === null || value === undefined
                  ? "No data"
                  : `${Number(value).toFixed(dataKey === "weight" ? 1 : 0)} ${unit}`,
                label,
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e1e4e8",
                boxShadow: "0 8px 20px rgba(23,25,29,.1)",
              }}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${dataKey}-fill)`}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ProgressCharts() {
  const [days, setDays] = useState(30);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch("/api/progress");

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();

        setWeightLogs(data.weights ?? []);
        setFoodLogs(data.foodLogs ?? []);
      } catch {
        setMessage("Unable to load progress history.");
      } finally {
        setLoading(false);
      }
    }

    void loadProgress();
  }, []);

  const latestWeight =
    weightLogs.length > 0
      ? Number(weightLogs[weightLogs.length - 1].weight_kg)
      : null;

  const previousWeight =
    weightLogs.length > 1
      ? Number(weightLogs[weightLogs.length - 2].weight_kg)
      : null;

  const weightChange =
    latestWeight !== null && previousWeight !== null
      ? latestWeight - previousWeight
      : null;

  const chartData = useMemo(() => {
    const today = new Date();

    const dates: string[] = [];

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() - index);

      dates.push(dateKey(date));
    }

    const caloriesByDate = new Map<string, number>();
    const proteinByDate = new Map<string, number>();

    for (const log of foodLogs) {
      const key = dateKey(new Date(log.logged_at));

      caloriesByDate.set(
        key,
        (caloriesByDate.get(key) ?? 0) + Number(log.calories ?? 0),
      );

      proteinByDate.set(
        key,
        (proteinByDate.get(key) ?? 0) + Number(log.protein ?? 0),
      );
    }

    const weightByDate = new Map<string, number>();

    for (const log of weightLogs) {
      const key = dateKey(new Date(log.logged_at));

      weightByDate.set(
        key,
        Number(log.weight_kg),
      );
    }

    return dates.map((date) => ({
      date,
      calories: caloriesByDate.has(date)
        ? Math.round(caloriesByDate.get(date) ?? 0)
        : null,
      protein: proteinByDate.has(date)
        ? Math.round(proteinByDate.get(date) ?? 0)
        : null,
      weight: weightByDate.has(date)
        ? weightByDate.get(date) ?? null
        : null,
    }));
  }, [days, foodLogs, weightLogs]);

  const sevenDayTrend = useMemo(() => {
    if (weightLogs.length < 2) {
      return null;
    }

    const latest = weightLogs[weightLogs.length - 1];
    const latestDate = new Date(latest.logged_at);

    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - 7);

    const previous = [...weightLogs]
      .reverse()
      .find((log) => new Date(log.logged_at) <= cutoff);

    if (!previous) {
      return null;
    }

    return Number(latest.weight_kg) - Number(previous.weight_kg);
  }, [weightLogs]);

  const thirtyDayTrend = useMemo(() => {
    if (weightLogs.length < 2) {
      return null;
    }

    const latest = weightLogs[weightLogs.length - 1];
    const latestDate = new Date(latest.logged_at);

    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - 30);

    const previous = [...weightLogs]
      .reverse()
      .find((log) => new Date(log.logged_at) <= cutoff);

    if (!previous) {
      return null;
    }

    return Number(latest.weight_kg) - Number(previous.weight_kg);
  }, [weightLogs]);

  async function saveWeight() {
    const parsedWeight = Number(weight);

    if (!parsedWeight || parsedWeight <= 0 || parsedWeight > 500) {
      setMessage("Enter a valid weight.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weight: parsedWeight,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setWeightLogs((current) =>
        [...current, data].sort(
          (a, b) =>
            new Date(a.logged_at).getTime() -
            new Date(b.logged_at).getTime(),
        ),
      );

      setWeight("");
      setWeightOpen(false);
      setMessage("Weight saved.");
    } catch {
      setMessage("Unable to save your weight.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeading
        eyebrow="Your patterns"
        title="Progress"
        description="A calm view of your own consistency. Targets and body weight are never compared with anyone else."
        action={
          <div className="flex rounded-lg border border-[#e1e4e8] bg-white p-1 dark:border-white/[0.08] dark:bg-[#181b21]">
            {ranges.map((range) => (
              <button
                key={range.count}
                type="button"
                onClick={() => setDays(range.count)}
                className={`rounded-md px-3 py-2 text-xs font-bold ${
                  days === range.count
                    ? "bg-moss-600 text-white"
                    : "text-[#70757f]"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-7 grid gap-4 xl:grid-cols-2">
        <ChartPanel
          label="Daily calories"
          dataKey="calories"
          color="#8170e6"
          unit="kcal"
          data={chartData}
        />

        <ChartPanel
          label="Daily protein"
          dataKey="protein"
          color="#e5b64f"
          unit="g"
          data={chartData}
        />

        <ChartPanel
          label="Body weight"
          dataKey="weight"
          color="#9b8cff"
          unit="kg"
          data={chartData}
        />

        <section className="rounded-xl bg-ink p-5 text-white">
          <p className="text-sm font-medium text-[#b8bcc5]">
            Weight check-in
          </p>

          <p className="mt-2 text-4xl font-bold">
            {loading
              ? "—"
              : latestWeight !== null
                ? latestWeight.toFixed(1)
                : "—"}

            <span className="text-xl text-[#b8bcc5]">
              {" "}
              kg
            </span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
            <p>
              <span className="block text-lg font-bold">
                {weightChange !== null
                  ? `${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)}`
                  : "—"}
              </span>

              <span className="text-xs text-[#b8bcc5]">
                vs. previous
              </span>
            </p>

            <p>
              <span className="block text-lg font-bold">
                {sevenDayTrend !== null
                  ? `${sevenDayTrend >= 0 ? "+" : ""}${sevenDayTrend.toFixed(1)}`
                  : "—"}
              </span>

              <span className="text-xs text-[#b8bcc5]">
                7-day trend
              </span>
            </p>

            <p>
              <span className="block text-lg font-bold">
                {thirtyDayTrend !== null
                  ? `${thirtyDayTrend >= 0 ? "+" : ""}${thirtyDayTrend.toFixed(1)}`
                  : "—"}
              </span>

              <span className="text-xs text-[#b8bcc5]">
                30-day trend
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setWeightOpen(true);
            }}
            className="mt-6 rounded-lg bg-[#8170e6] px-4 py-2.5 text-sm font-bold transition hover:bg-[#6957d8]"
          >
            Log weight
          </button>

          {message && (
            <p className="mt-3 text-sm text-[#b8bcc5]">
              {message}
            </p>
          )}
        </section>
      </div>

      {weightOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#e1e4e8] bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-[#181b21]">
            <h2 className="text-lg font-bold">
              Log your weight
            </h2>

            <p className="mt-1 text-sm text-[#858b95]">
              Enter your current weight in kilograms.
            </p>

            <input
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="55.0"
              className="mt-5 w-full rounded-lg border border-[#dfe2e7] bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-[#8170e6] focus:ring-2 focus:ring-[#8170e6]/20 dark:border-white/10 dark:bg-[#111318]"
              autoFocus
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setWeightOpen(false);
                  setWeight("");
                }}
                className="flex-1 rounded-lg border border-[#e1e4e8] px-4 py-3 text-sm font-bold dark:border-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveWeight}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#6957d8] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5f4ec7] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save weight"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProgressCharts;