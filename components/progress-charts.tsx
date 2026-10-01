"use client";

import { useState } from "react";
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

const allData = Array.from({ length: 90 }, (_, index) => {
  const day = index + 1;

  return {
    day: `Sep ${day > 30 ? day - 30 : day}`,
    calories: 1700 + ((index * 137) % 650),
    protein: 92 + ((index * 17) % 45),
    weight: Number(
      (55.8 - index * 0.012 + ((index % 5) - 2) * 0.08).toFixed(1),
    ),
  };
});

const ranges = [
  { label: "7 days", count: 7 },
  { label: "30 days", count: 30 },
  { label: "90 days", count: 90 },
];

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
  data: typeof allData;
}) {
  return (
    <section className="rounded-xl border border-[#e1e4e8] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#181b21] sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">{label}</h2>

        <p
          className="text-sm font-semibold"
          style={{ color }}
        >
          {data.at(-1)?.[dataKey]} {unit}
        </p>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
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
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#858b95" }}
              minTickGap={26}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#858b95" }}
            />

            <Tooltip
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ProgressCharts() {
  const [days, setDays] = useState(30);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const data = allData.slice(-days);

  async function saveWeight() {
    const value = Number(weight);

    if (!Number.isFinite(value) || value <= 0 || value > 500) {
      setMessage("Enter a valid weight.");
      return;
    }

    setSaving(true);
    setMessage(null);

    // Weight persistence will be connected to Supabase next.
    await new Promise((resolve) => setTimeout(resolve, 400));

    setSaving(false);
    setWeightOpen(false);
    setWeight("");

    setMessage(`Weight check-in saved: ${value.toFixed(1)} kg`);

    window.setTimeout(() => setMessage(null), 3000);
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
                onClick={() => setDays(range.count)}
                className={`rounded-md px-3 py-2 text-xs font-bold ${
                  days === range.count
                    ? "bg-moss-600 text-white"
                    : "text-[#858b95] hover:bg-[#f3f4f6] dark:hover:bg-white/[0.05]"
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
          color="#6957d8"
          unit="kcal"
          data={data}
        />

        <ChartPanel
          label="Daily protein"
          dataKey="protein"
          color="#8170e6"
          unit="g"
          data={data}
        />

        <ChartPanel
          label="Body weight"
          dataKey="weight"
          color="#e5b64f"
          unit="kg"
          data={data}
        />

        <section className="rounded-xl bg-[#17191d] p-5 text-white">
          <p className="text-sm font-medium text-[#a1a6b0]">
            Weight check-in
          </p>

          <p className="mt-2 text-4xl font-bold">
            55.0{" "}
            <span className="text-xl text-[#a1a6b0]">
              kg
            </span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5 text-center">
            <p>
              <span className="block text-lg font-bold">-0.2</span>
              <span className="text-xs text-[#9298a1]">
                vs. previous
              </span>
            </p>

            <p>
              <span className="block text-lg font-bold">-0.4</span>
              <span className="text-xs text-[#9298a1]">
                7-day trend
              </span>
            </p>

            <p>
              <span className="block text-lg font-bold">-0.8</span>
              <span className="text-xs text-[#9298a1]">
                30-day trend
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWeightOpen(true)}
            className="mt-6 rounded-lg bg-[#6957d8] px-4 py-2.5 text-sm font-bold transition hover:bg-[#5f4ec7]"
          >
            Log weight
          </button>
        </section>
      </div>

      {weightOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#181b21]">
            <h2 className="text-xl font-bold">
              Log weight
            </h2>

            <p className="mt-1 text-sm text-[#858b95] dark:text-[#aeb4bf]">
              Enter your current body weight.
            </p>

            <label className="mt-5 block text-sm font-bold">
              Weight (kg)

              <input
                autoFocus
                inputMode="decimal"
                type="number"
                min="1"
                max="500"
                step="0.1"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="55.0"
                className="mt-2 w-full rounded-lg border border-[#e1e4e8] bg-white px-3 py-3 text-lg font-semibold outline-none focus:border-[#6957d8] focus:ring-2 focus:ring-[#6957d8]/20 dark:border-white/[0.08] dark:bg-[#111318]"
              />
            </label>

            {message && (
              <p className="mt-3 text-sm font-semibold text-red-500">
                {message}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setWeightOpen(false);
                  setWeight("");
                  setMessage(null);
                }}
                className="flex-1 rounded-lg border border-[#e1e4e8] px-4 py-3 text-sm font-bold dark:border-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveWeight()}
                className="flex-1 rounded-lg bg-[#6957d8] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save weight"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && !weightOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#17191d] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {message}
        </div>
      )}
    </>
  );
}