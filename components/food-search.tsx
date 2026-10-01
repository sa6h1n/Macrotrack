/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Sparkles, Database, ExternalLink } from "lucide-react";
import type { Food } from "@/types/domain";


function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }

    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function fuzzyScore(query: string, food: Food): number {
  const q = normalizeSearchText(query);
  const name = normalizeSearchText(food.name);
  const brand = normalizeSearchText(food.brand ?? "");

  if (!q || !name) return 0;
  if (name === q) return 1000;
  if (name.startsWith(q)) return 900;
  if (name.includes(q)) return 800;

  const words = `${name} ${brand}`.split(/\s+/).filter(Boolean);
  const bestWord = Math.min(...words.map((word) => levenshtein(q, word)));
  const maxDistance = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;

  if (bestWord > maxDistance) return 0;

  return 700 - bestWord * 100;
}

function mapFood(row: any, persisted = true): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description,
    foodType: row.food_type ?? row.foodType ?? "generic",
    measurementState: row.measurement_state ?? row.measurementState ?? "as_served",
    source: row.source ?? "Custom",
    sourceId: row.source_id ?? row.sourceId ?? null,
    calories: Number(row.calories_per_100g ?? row.calories ?? 0),
    protein: Number(row.protein_per_100g ?? row.protein ?? 0),
    carbs: Number(row.carbs_per_100g ?? row.carbs ?? 0),
    fat: Number(row.fat_per_100g ?? row.fat ?? 0),
    fiber: Number(row.fiber_per_100g ?? row.fiber ?? 0),
    isGlobal: row.is_global ?? false,
    persisted,
  };
}

async function persistExternalFood(food: Food): Promise<Food> {
  const response = await fetch("/api/foods/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: food.name,
      brand: food.brand ?? null,
      description: food.description ?? null,
      measurementState: food.measurementState,
      source: food.source,
      sourceId: food.sourceId,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message ?? "Unable to add this food to your library.");
  return mapFood(data, true);
}

export function FoodSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search chicken, rice, curd...",
  excludeIds = [],
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (food: Food) => void;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}) {
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const allowExternalSearch = pathname === "/app/foods";
  const excludeKey = excludeIds.join("|");

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const localResponse = await fetch(
          `/api/foods?q=${encodeURIComponent(query)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!localResponse.ok) throw new Error("Unable to search your food library.");

        const localRows = await localResponse.json();
        const localFoods = (localRows ?? []).map((row: any) => mapFood(row, true));

        let apiFoods: Food[] = [];
        if (allowExternalSearch) {
          const apiResponse = await fetch(
            `/api/nutrition/search?q=${encodeURIComponent(query)}`,
            { cache: "no-store", signal: controller.signal },
          );
          const apiRows = apiResponse.ok ? await apiResponse.json() : [];
          apiFoods = (apiRows ?? []).map((row: any) => mapFood(row, false));
        }

        const seen = new Set<string>();
        const merged = [...localFoods, ...apiFoods].filter((food) => {
          if (excludeIds.includes(food.id)) return false;
          const key = `${food.name.toLowerCase()}|${food.brand?.toLowerCase() ?? ""}|${food.measurementState}|${food.source}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const ranked = merged
          .map((food, index) => ({
            food,
            score: fuzzyScore(query, food),
            index,
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score || a.index - b.index)
          .map((item) => item.food);

        setResults(ranked.slice(0, 12));
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setResults([]);
          setError(err instanceof Error ? err.message : "Search failed.");
        }
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, excludeKey, allowExternalSearch]);

  async function choose(food: Food) {
    if (addingId) return;
    if (food.persisted !== false) {
      onSelect(food);
      return;
    }
    setAddingId(food.id);
    setError(null);
    try {
      const saved = await persistExternalFood(food);
      onSelect(saved);
      setResults((current) => current.map((item) => item.id === food.id ? saved : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add this API food.");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-3 text-[#7b897e]" size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#e1e4e8] bg-[#f8f9fb] py-3 pl-10 pr-3 text-sm outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5"
      />
      {value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-lg border border-[#e1e4e8] bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#181b21]">
          {searching ? (
            <p className="px-3 py-4 text-sm text-[#858b95]">
              {allowExternalSearch ? "Searching your library and nutrition databases…" : "Searching your library…"}
            </p>
          ) : results.length ? (
            results.map((food) => (
              <button
                key={`${food.source}-${food.id}`}
                type="button"
                disabled={Boolean(addingId)}
                onClick={() => void choose(food)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-[#f4f7f4] disabled:opacity-60 dark:hover:bg-white/5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-moss-50 text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">
                  {food.persisted === false ? <Sparkles size={15} /> : <Database size={15} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{food.name}</span>
                  <span className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-[#858b95] dark:text-[#aeb4bf]">
                    <span>{food.brand ? `${food.brand} · ` : ""}{food.measurementState.replace("_", " ")}</span>
                    <span>{food.persisted === false ? `Add from ${food.source}` : food.isGlobal ? "MacroTrack" : "My foods"}</span>
                  </span>
                </span>
                <span className="ml-2 shrink-0 text-right text-xs text-[#858b95] dark:text-[#aeb4bf]">
                  {addingId === food.id ? "Adding…" : `${Math.round(food.calories)} kcal · ${food.protein.toFixed(1)}g P`}
                </span>
              </button>
            ))
          ) : (
            allowExternalSearch ? (
              <p className="px-3 py-4 text-sm text-[#858b95]">No matching food found in your library or nutrition sources.</p>
            ) : (
              <div className="px-3 py-4">
                <p className="text-sm font-semibold text-[#344238] dark:text-[#dce7dd]">
                  Food not found in your library
                </p>
                <p className="mt-1 text-xs leading-5 text-[#858b95] dark:text-[#aeb4bf]">
                  Go to Foods → Add Custom Food to search external food databases.
                </p>
                <Link
                  href="/app/foods"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-moss-600 px-3 py-2 text-xs font-bold text-white hover:bg-moss-700"
                >
                  <ExternalLink size={14} />
                  Add Custom Food
                </Link>
              </div>
            )
          )}
          {error && <p className="border-t border-[#e9ebef] px-3 py-3 text-xs font-semibold text-coral-600 dark:border-white/10">{error}</p>}
        </div>
      )}
    </div>
  );
}
