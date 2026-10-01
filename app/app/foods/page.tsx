/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Apple, ChevronRight, Flame, Heart, Leaf, Plus, Search, Star, Wheat } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { FoodSearch } from "@/components/food-search";
import type { Food } from "@/types/domain";

function mapFood(row: any): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description,
    foodType: row.food_type,
    measurementState: row.measurement_state,
    source: row.source,
    sourceId: row.source_id,
    calories: Number(row.calories_per_100g),
    protein: Number(row.protein_per_100g),
    carbs: Number(row.carbs_per_100g),
    fat: Number(row.fat_per_100g),
    fiber: Number(row.fiber_per_100g),
    isGlobal: row.is_global,
    persisted: true,
  };
}

type Category = "all" | "favorites" | "protein" | "carbs" | "fats" | "vegetables" | "fruits" | "indian";

const categories: Array<{ id: Category; title: string; subtitle: string; icon: typeof Flame }> = [
  { id: "protein", title: "Protein Rich", subtitle: "High-protein foods", icon: Flame },
  { id: "carbs", title: "Best Carbs", subtitle: "Rice, grains & energy foods", icon: Wheat },
  { id: "fats", title: "Healthy Fats", subtitle: "Nuts, seeds & oils", icon: Heart },
  { id: "vegetables", title: "Vegetables", subtitle: "Everyday vegetables", icon: Leaf },
  { id: "fruits", title: "Fruits", subtitle: "Fresh & naturally sweet", icon: Apple },
];

function matchesCategory(food: Food, category: Category) {
  const name = food.name.toLowerCase();

  if (category === "protein") return food.protein >= 15;
  if (category === "carbs") return food.carbs >= 20 && food.carbs > food.protein;
  if (category === "fats") return food.fat >= 12;
  if (category === "vegetables") {
    return /carrot|broccoli|cauliflower|cabbage|spinach|beans|beetroot|bottle gourd|bitter gourd|okra|brinjal|eggplant|mushroom|tomato|onion|capsicum|cucumber|lettuce|pumpkin|corn|zucchini|avial|thoran|mezhukkupuratti|olan|erissery|sambar|vegetable/.test(name);
  }
  if (category === "fruits") {
    return /apple|banana|orange|lime|mango|pineapple|papaya|watermelon|grape|strawberr|blueberr|kiwi|guava|pomegranate|pear|peach|jackfruit|avocado|nendran|chakka/.test(name);
  }
  if (category === "indian") {
    return /dosa|idli|puttu|appam|idiyappam|pathiri|parotta|chapati|roti|paratha|dal|curry|biryani|sambar|rasam|paneer|chole|rajma|pav bhaji|poha|pulao|rice|thoran|avial|erissery|olan|kalan|moru|payasam|chammanthi|chutney|vada/.test(name);
  }
  return true;
}

function rankForCategory(foods: Food[], category: Category) {
  return foods
    .filter((food) => matchesCategory(food, category))
    .sort((a, b) => {
      if (category === "protein") return b.protein - a.protein;
      if (category === "carbs") return b.carbs - a.carbs;
      if (category === "fats") return b.fat - a.fat;
      return a.name.localeCompare(b.name);
    });
}

export default function FoodsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [foods, setFoods] = useState<Food[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFoods() {
    setLoading(true);
    try {
      const response = await fetch("/api/foods", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load your foods.");
      const data = await response.json();
      setFoods((data ?? []).map(mapFood));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load your foods.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    setFavoritesLoading(true);
    try {
      const response = await fetch("/api/foods/favorite", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load favorites.");
      const data = await response.json();
      setFavorites(new Set(Array.isArray(data) ? data : []));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load favorites.");
    } finally {
      setFavoritesLoading(false);
    }
  }

  useEffect(() => {
    void loadFoods();
    void loadFavorites();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = foods;

    if (category === "favorites") {
      result = result.filter((food) => favorites.has(food.id));
    } else if (category !== "all") {
      result = rankForCategory(result, category);
    }

    if (!normalized) return result;
    return result.filter((food) => `${food.name} ${food.brand ?? ""}`.toLowerCase().includes(normalized));
  }, [foods, favorites, category, query]);

  const categoryCards = categories.map((item) => {
    const count = rankForCategory(foods, item.id).length;
    return { ...item, count };
  });

  function onFoodSelected(food: Food) {
    setQuery("");
    setMessage(`${food.name} is now in your food library.`);
    void loadFoods();
    window.setTimeout(() => setMessage(null), 3200);
  }

  async function toggleFavorite(food: Food) {
    const isFavorite = favorites.has(food.id);
    setFavorites((current) => {
      const next = new Set(current);
      if (isFavorite) next.delete(food.id);
      else next.add(food.id);
      return next;
    });

    try {
      const response = await fetch("/api/foods/favorite", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: food.id }),
      });
      if (!response.ok) throw new Error("Could not update favorite.");
    } catch (error) {
      setFavorites((current) => {
        const next = new Set(current);
        if (isFavorite) next.add(food.id);
        else next.delete(food.id);
        return next;
      });
      setMessage(error instanceof Error ? error.message : "Could not update favorite.");
      window.setTimeout(() => setMessage(null), 2800);
    }
  }

  return (
    <>
      <SectionHeading
        eyebrow="Your food library"
        title="Foods"
        description="Browse your library by nutrition category, favorite your go-to foods, or search USDA and Open Food Facts for something new."
        action={
          <button
            type="button"
            onClick={() => {
              setQuery("");
              window.setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('input[placeholder="Search chicken, bread, rice, branded foods..."]');
                input?.focus();
                input?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
            className="flex items-center gap-2 rounded-lg bg-moss-600 px-4 py-3 text-sm font-bold text-white"
          >
            <Plus size={17} /> Add Custom Food
          </button>
        }
      />

      <div className="mt-6 max-w-xl">
        <FoodSearch
          value={query}
          onChange={setQuery}
          onSelect={onFoodSelected}
          placeholder="Search chicken, bread, rice, branded foods..."
        />
        <p className="mt-2 text-xs text-[#858b95] dark:text-[#aeb4bf]">
          External results from USDA and Open Food Facts can be saved to your private library.
        </p>
      </div>

      {!query.trim() && (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#858b95] dark:text-[#aeb4bf]">Browse by category</p>
              <p className="mt-1 text-xs text-[#8a968c]">Quick collections based on nutrition and food type.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryCards.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className="group rounded-xl border border-[#e1e4e8] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#181b21]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-lg bg-moss-50 text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{item.title}</p>
                      <p className="mt-1 text-xs text-[#858b95] dark:text-[#aeb4bf]">{item.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.count}</p>
                      <ChevronRight size={16} className="ml-auto text-[#8a968c]" />
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCategory("favorites")}
              className="group rounded-xl border border-[#e1e4e8] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#181b21]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200">
                  <Star size={19} fill="currentColor" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Favorites</p>
                  <p className="mt-1 text-xs text-[#858b95] dark:text-[#aeb4bf]">Your personal go-to foods</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{favorites.size}</p>
                  <ChevronRight size={16} className="ml-auto text-[#8a968c]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCategory("indian")}
              className="group rounded-xl border border-[#e1e4e8] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#181b21]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200">
                  <span className="text-lg">🇮🇳</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Indian & Kerala</p>
                  <p className="mt-1 text-xs text-[#858b95] dark:text-[#aeb4bf]">Everyday Indian & Kerala foods</p>
                </div>
                <ChevronRight size={16} className="text-[#8a968c]" />
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-2">
        {(["all", "favorites", "protein", "carbs", "fats", "vegetables", "fruits", "indian"] as Category[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${
              category === item
                ? "bg-moss-600 text-white"
                : "bg-white text-[#6b707a] ring-1 ring-[#e1e4e8] dark:bg-[#181b21] dark:text-[#aeb4bf] dark:ring-white/10"
            }`}
          >
            {item === "all" ? "All foods" : item === "indian" ? "Indian & Kerala" : item}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#e1e4e8] bg-white shadow-sm dark:border-white/10 dark:bg-[#181b21]">
        {loading || favoritesLoading ? (
          <div className="px-4 py-12 text-center text-sm text-[#858b95]">Loading foods…</div>
        ) : filtered.map((food) => {
          const isFavorite = favorites.has(food.id);
          return (
            <div key={food.id} className="flex items-center gap-3 border-b border-[#e9ebef] px-4 py-4 last:border-0 dark:border-white/10">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-moss-50 font-bold text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">
                {food.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {food.name}
                  <span className="ml-1 text-xs font-bold uppercase tracking-wide text-moss-700 dark:text-moss-100">
                    {food.measurementState.replace("_", " ")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[#858b95] dark:text-[#aeb4bf]">
                  {food.brand ? `${food.brand} · ` : ""}{food.source}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-bold">{food.calories} kcal</p>
                <p className="mt-1 text-xs text-[#858b95] dark:text-[#aeb4bf]">{food.protein}g protein / 100g</p>
              </div>
              <button
                type="button"
                aria-label={isFavorite ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={() => void toggleFavorite(food)}
                className={`grid size-9 shrink-0 place-items-center rounded-full transition ${
                  isFavorite
                    ? "bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300"
                    : "bg-[#f4f7f4] text-[#819087] hover:text-amber-500 dark:bg-white/5 dark:text-[#aeb4bf]"
                }`}
              >
                <Star size={17} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
        {!loading && !favoritesLoading && !filtered.length && (
          <div className="px-4 py-12 text-center text-sm text-[#858b95]">
            {category === "favorites"
              ? "You haven't favorited any foods yet. Tap the star beside a food to add it here."
              : "No foods match this category or search."}
          </div>
        )}
      </div>

      {message && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-8">
          {message}
        </div>
      )}
    </>
  );
}
