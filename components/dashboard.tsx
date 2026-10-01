/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, X, ClipboardList } from "lucide-react";
import { calculateGoalProgress, calculateNutrition, sumNutrition } from "@/lib/nutrition/calculations";
import { formatNumber } from "@/lib/utils";
import type { Food, FoodLog, Meal, Profile } from "@/types/domain";
import { MEAL_LABELS } from "@/types/domain";
import { FoodSearch } from "@/components/food-search";
import { createClient } from "@/lib/supabase/client";

const meals: Meal[] = ["breakfast", "lunch", "evening", "dinner", "snack"];
const mealInputLabels: Record<Meal, string> = {
  breakfast: "Morning / Breakfast",
  lunch: "Lunch",
  evening: "Evening",
  dinner: "Dinner",
  snack: "Snacks",
};

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function mapLog(row: any): FoodLog {
  const food = Array.isArray(row.foods) ? row.foods[0] : row.foods;
  const recipe = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
  return {
    id: row.id,
    foodId: row.food_id,
    recipeId: row.recipe_id,
    foodName: food?.name ?? recipe?.name ?? "Logged food",
    meal: row.meal,
    quantityGrams: Number(row.quantity_grams),
    measurementState: row.measurement_state,
    loggedAt: row.logged_at,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fiber: Number(row.fiber),
  };
}

function ProgressRing({ label, value, target, unit, hue }: { label: string; value: number; target: number; unit: string; hue: string }) {
  const progress = Math.min(calculateGoalProgress(value, target), 100);
  return <div className="flex items-center gap-3"><div className="grid size-[66px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${hue} ${progress * 3.6}deg, #e8eee8 0deg)` }}><div className="grid size-[54px] place-items-center rounded-full bg-white text-[11px] font-bold dark:bg-[#18201a]">{progress}%</div></div><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-sm text-[#6d7c70] dark:text-[#aebbb0]"><span className="font-bold text-ink dark:text-white">{formatNumber(value, 1)}</span> / {formatNumber(target)} {unit}</p></div></div>;
}

export function Dashboard() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const dashboardDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "") ? requestedDate! : localDate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const totals = useMemo(() => sumNutrition(logs), [logs]);
  const displayDate = new Date(`${dashboardDate}T12:00:00`);
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", month: "long", day: "numeric" }).format(displayDate);
  const isToday = dashboardDate === localDate();

  async function loadDashboard() {
    setLoading(true);
    setLoadError(null);
    try {
      const dashboardResponse = await fetch(`/api/dashboard?date=${dashboardDate}`, { cache: "no-store" });
      if (!dashboardResponse.ok) throw new Error("Unable to load your data.");
      const dashboard = await dashboardResponse.json();
      setProfile({
        id: dashboard.profile.user_id ?? "profile",
        name: dashboard.profile.name ?? "Member",
        email: dashboard.profile.email ?? "",
        calorieTarget: Number(dashboard.profile.calorie_target ?? 2200),
        proteinTarget: Number(dashboard.profile.protein_target ?? 120),
        carbTarget: Number(dashboard.profile.carb_target ?? 260),
        fatTarget: Number(dashboard.profile.fat_target ?? 70),
        goal: "gain",
      });
      setLogs((dashboard.logs ?? []).map(mapLog));
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to load your data.";
      setLoadError(text);
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(); }, [dashboardDate]);

  async function removeLog(id: string) {
    const response = await fetch(`/api/dashboard?id=${id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Unable to remove this meal.");
    setLogs((current) => current.filter((log) => log.id !== id));
  }

  async function addLogs(items: Array<{ food: Food; grams: number; meal: Meal }>) {
    const saved: FoodLog[] = [];
    const failures: string[] = [];
    for (const item of items) {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: item.food.id,
          grams: item.grams,
          meal: item.meal,
          measurementState: item.food.measurementState,
          loggedAt: `${dashboardDate}T12:00:00.000Z`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) failures.push(`${item.food.name}: ${payload.message ?? "Unable to save"}`);
      else saved.push(mapLog({ ...payload, foods: { name: item.food.name } }));
    }
    if (saved.length) setLogs((current) => [...current, ...saved]);
    if (failures.length) {
      setMessage(failures.join(" • "));
      return false;
    }
    const firstMeal = items[0]?.meal;
    setMessage(`${saved.length} ${saved.length === 1 ? "food" : "foods"} saved${firstMeal ? ` to ${mealInputLabels[firstMeal].toLowerCase()}` : ""}.`);
    window.setTimeout(() => setMessage(null), 3200);
    return true;
  }

  function openAdd(meal?: Meal) {
    setSelectedMeal(meal ?? null);
    setAddOpen(true);
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-sm font-semibold text-[#718074] dark:text-[#aebbb0]">Loading your day…</div>;

  if (!profile) return (
    <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center">
      <div className="w-full rounded-2xl border border-[#dfe7df] bg-white p-7 text-center shadow-sm dark:border-white/10 dark:bg-[#18201a]">
        <h1 className="text-xl font-bold">We couldn&apos;t load your day</h1>
        <p className="mt-2 text-sm leading-6 text-[#6d7c70] dark:text-[#aebbb0]">{loadError ?? "Your profile is not ready yet."}</p>
        <button onClick={() => void loadDashboard()} className="mt-5 rounded-lg bg-moss-600 px-5 py-3 text-sm font-bold text-white hover:bg-moss-700">Try again</button>
      </div>
    </div>
  );

  return <>
    <header className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-[#68776c] dark:text-[#aebbb0]">{date}</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Good morning, {profile.name}.</h1></div><button onClick={() => openAdd()} className="hidden items-center gap-2 rounded-lg bg-moss-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-moss-700 sm:flex"><Plus size={18}/>Add food</button></header>
    <section className="mt-7 rounded-lg bg-ink p-5 text-white shadow-soft sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#b8c8ba]">{isToday ? "Today\'s calories" : "Daily calories"}</p><p className="mt-1 text-4xl font-bold tracking-tight"><span>{formatNumber(totals.calories)}</span><span className="text-xl font-medium text-[#b8c8ba]"> / {formatNumber(profile.calorieTarget)} kcal</span></p></div><div className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-[#e4eee5]">{calculateGoalProgress(totals.calories, profile.calorieTarget)}% of target</div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#a9d89b] transition-all" style={{ width: `${Math.min(calculateGoalProgress(totals.calories, profile.calorieTarget), 100)}%` }}/></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center"><p><span className="block text-lg font-bold">{formatNumber(totals.protein, 1)}g</span><span className="text-xs text-[#b8c8ba]">Protein</span></p><p><span className="block text-lg font-bold">{formatNumber(totals.carbs, 1)}g</span><span className="text-xs text-[#b8c8ba]">Carbs</span></p><p><span className="block text-lg font-bold">{formatNumber(totals.fat, 1)}g</span><span className="text-xs text-[#b8c8ba]">Fat</span></p></div></section>
    <section className="mt-7 grid gap-3 sm:grid-cols-3"><ProgressRing label="Protein" value={totals.protein} target={profile.proteinTarget} unit="g" hue="#5d8e59"/><ProgressRing label="Carbs" value={totals.carbs} target={profile.carbTarget} unit="g" hue="#e5b64f"/><ProgressRing label="Fat" value={totals.fat} target={profile.fatTarget} unit="g" hue="#dc6d4c"/></section>
    <section className="mt-9"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{isToday ? "Today\'s meals" : "Meals"}</h2><p className="mt-1 text-sm text-[#6d7c70] dark:text-[#aebbb0]">Add one food or build a whole meal in one go.</p></div><button onClick={() => openAdd()} className="grid size-10 place-items-center rounded-lg border border-[#dce5dc] bg-white text-moss-700 shadow-sm dark:border-white/10 dark:bg-[#18201a]" aria-label="Add food"><Plus size={20}/></button></div><div className="mt-4 space-y-3">{meals.map((meal) => <MealCard key={meal} meal={meal} logs={logs.filter((log) => log.meal === meal)} onAdd={() => openAdd(meal)} onDelete={removeLog}/>)}</div></section>
    <section className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#dce5dc] bg-[#dce5dc] text-center dark:border-white/10 dark:bg-white/10 sm:grid-cols-5"><Total label="Calories" value={formatNumber(totals.calories)} unit="kcal"/><Total label="Protein" value={formatNumber(totals.protein, 1)} unit="g"/><Total label="Carbs" value={formatNumber(totals.carbs, 1)} unit="g"/><Total label="Fat" value={formatNumber(totals.fat, 1)} unit="g"/><Total label="Fiber" value={formatNumber(totals.fiber, 1)} unit="g"/></section>
    <button onClick={() => openAdd()} className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-lg bg-moss-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg lg:hidden"><Plus size={19}/>Add food</button>
    {message && <div className="fixed bottom-24 left-1/2 z-30 max-w-[90vw] -translate-x-1/2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-8">{message}</div>}
    {addOpen && <AddFoodDialog initialMeal={selectedMeal} onClose={() => setAddOpen(false)} onSave={addLogs}/>} 
  </>;
}

function MealCard({ meal, logs, onAdd, onDelete }: { meal: Meal; logs: FoodLog[]; onAdd: () => void; onDelete: (id: string) => void }) {
  const totals = sumNutrition(logs);
  return <article className="rounded-lg border border-[#dfe7df] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#18201a]"><div className="flex items-center justify-between"><div><h3 className="font-bold">{MEAL_LABELS[meal]}</h3><p className="mt-0.5 text-xs text-[#6d7c70] dark:text-[#aebbb0]">{formatNumber(totals.calories)} kcal {logs.length ? `- ${formatNumber(totals.protein, 1)}g protein` : ""}</p></div><button onClick={onAdd} className="rounded-md px-2.5 py-2 text-xs font-bold text-moss-700 hover:bg-moss-50 dark:text-moss-100 dark:hover:bg-white/5">+ Add</button></div>{logs.length ? <div className="mt-3 divide-y divide-[#edf1ed] dark:divide-white/10">{logs.map((log) => <div key={log.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-moss-50 text-sm font-bold text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">{log.foodName.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{log.foodName}</p><p className="mt-0.5 text-xs uppercase tracking-wide text-[#78877b]">{log.quantityGrams}g · {log.measurementState.replace("_", " ")}</p></div><div className="text-right"><p className="text-sm font-bold">{formatNumber(log.calories)} kcal</p><p className="text-xs text-[#6d7c70] dark:text-[#aebbb0]">P {formatNumber(log.protein, 1)} · C {formatNumber(log.carbs, 1)} · F {formatNumber(log.fat, 1)}</p></div><button onClick={() => onDelete(log.id)} className="ml-1 grid size-8 place-items-center rounded-md text-[#9aa79c] hover:bg-coral-50 hover:text-coral-500" aria-label={`Remove ${log.foodName}`}><Trash2 size={16}/></button></div>)}</div> : <button onClick={onAdd} className="mt-3 w-full rounded-md border border-dashed border-[#d9e3d9] py-3 text-sm font-semibold text-[#718174] hover:border-moss-500 hover:text-moss-700 dark:border-white/15 dark:text-[#aebbb0]">No meals logged yet</button>}</article>;
}

function Total({ label, value, unit }: { label: string; value: string; unit: string }) { return <div className="bg-white px-2 py-4 dark:bg-[#18201a]"><p className="text-xs font-medium text-[#728076] dark:text-[#aebbb0]">{label}</p><p className="mt-1 text-lg font-bold">{value}<span className="ml-0.5 text-xs text-[#718174]">{unit}</span></p></div>; }

type PendingFood = { id: string; food: Food; grams: string; meal: Meal };

function AddFoodDialog({ initialMeal, onClose, onSave }: { initialMeal: Meal | null; onClose: () => void; onSave: (items: Array<{ food: Food; grams: number; meal: Meal }>) => Promise<boolean> }) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<PendingFood[]>([]);
  const [defaultMeal, setDefaultMeal] = useState<Meal>(initialMeal ?? "breakfast");
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; items: Array<{ food: Food; grams: number }> }>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadTemplates() {
      setTemplatesLoading(true);
      const { data } = await supabase
        .from("meal_templates")
        .select("id,name,meal_template_items(id,quantity_grams,measurement_state,foods(*))")
        .order("created_at", { ascending: false });

      if (!active) return;

      const mapped = (data ?? []).map((template: any) => ({
        id: template.id,
        name: template.name,
        items: (template.meal_template_items ?? [])
          .map((item: any) => {
            const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;
            if (!food) return null;
            return {
              food: {
                id: food.id,
                name: food.name,
                brand: food.brand ?? null,
                source: food.source ?? "custom",
                foodType: food.food_type ?? food.foodType ?? "generic",
                measurementState: item.measurement_state ?? food.measurement_state ?? food.measurementState ?? "as_served",
                caloriesPer100g: Number(food.calories_per_100g ?? food.caloriesPer100g ?? 0),
                proteinPer100g: Number(food.protein_per_100g ?? food.proteinPer100g ?? 0),
                carbsPer100g: Number(food.carbs_per_100g ?? food.carbsPer100g ?? 0),
                fatPer100g: Number(food.fat_per_100g ?? food.fatPer100g ?? 0),
                fiberPer100g: Number(food.fiber_per_100g ?? food.fiberPer100g ?? 0),
              } as Food,
              grams: Number(item.quantity_grams),
            };
          })
          .filter(Boolean) as Array<{ food: Food; grams: number }>,
      }));

      setTemplates(mapped);
      setTemplatesLoading(false);
    }

    void loadTemplates();
    return () => { active = false; };
  }, [supabase]);

  function useTemplate(template: { id: string; name: string; items: Array<{ food: Food; grams: number }> }) {
    setPending((current) => {
      const next = [...current];

      for (const templateItem of template.items) {
        const existing = next.find((item) => item.food.id === templateItem.food.id);
        if (existing) {
          const updated = next.map((item) =>
            item.id === existing.id
              ? { ...item, grams: String(templateItem.grams), meal: defaultMeal }
              : item,
          );
          next.splice(0, next.length, ...updated);
        } else {
          next.push({
            id: `${templateItem.food.id}-${Date.now()}-${next.length}`,
            food: templateItem.food,
            grams: String(templateItem.grams),
            meal: defaultMeal,
          });
        }
      }

      return next;
    });
    setTemplateOpen(false);
    setQuery("");
    setError(null);
  }

  function selectFood(food: Food) {
    setPending((current) => {
      const existing = current.find((item) => item.food.id === food.id);
      if (existing) return current.map((item) => item.id === existing.id ? { ...item, grams: "100" } : item);
      return [...current, { id: `${food.id}-${Date.now()}`, food, grams: "", meal: defaultMeal }];
    });
    setQuery("");
    setError(null);
  }

  function updateItem(id: string, patch: Partial<PendingFood>) {
    setPending((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function saveAll() {
    const valid = pending.filter((item) => Number(item.grams) >= 1);
    if (!valid.length) return setError("Enter a weight of at least 1g for a food before saving.");
    if (valid.length !== pending.length) return setError("Enter a weight of at least 1g for every selected food.");
    setSaving(true);
    setError(null);
    const ok = await onSave(valid.map((item) => ({ food: item.food, grams: Number(item.grams), meal: item.meal })));
    setSaving(false);
    if (ok) onClose();
  }

  const pendingTotals = sumNutrition(
    pending
      .filter((item) => {
        const grams = Number(item.grams);
        return Number.isFinite(grams) && grams > 0;
      })
      .map((item) => calculateNutrition(item.food, Number(item.grams))) as any,
  );

  return <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-label="Add food">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl dark:bg-[#18201a] sm:rounded-xl">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-moss-600">Fast logging</p><h2 className="mt-1 text-xl font-bold">Add food</h2><p className="mt-1 text-xs text-[#718074] dark:text-[#aebbb0]">Search your library or nutrition databases, add multiple foods, then save them together.</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-[#f2f5f1] dark:hover:bg-white/10" aria-label="Close"><X size={19}/></button></div>
      <div className="mt-5 flex gap-2">
        <div className="min-w-0 flex-1">
          <FoodSearch value={query} onChange={setQuery} onSelect={selectFood} excludeIds={pending.map((item) => item.food.id)} />
        </div>
        <button
          type="button"
          onClick={() => setTemplateOpen((value) => !value)}
          className="flex shrink-0 items-center gap-2 rounded-md border border-[#dbe5db] bg-white px-3 py-2.5 text-sm font-bold text-ink hover:bg-[#f5f8f4] dark:border-white/10 dark:bg-[#18201a] dark:text-white dark:hover:bg-white/10"
        >
          <ClipboardList size={17} />
          <span className="hidden sm:inline">Template</span>
        </button>
      </div>

      {templateOpen && (
        <div className="mt-2 rounded-lg border border-[#dfe7df] bg-[#f8faf7] p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Use a saved template</p>
              <p className="text-xs text-[#718074] dark:text-[#aebbb0]">Loads its foods and saved weights. You can edit them before saving.</p>
            </div>
            <button type="button" onClick={() => setTemplateOpen(false)} className="text-xs font-semibold text-[#718074]">Close</button>
          </div>
          {templatesLoading ? (
            <p className="mt-3 text-sm text-[#718074] dark:text-[#aebbb0]">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="mt-3 text-sm text-[#718074] dark:text-[#aebbb0]">No saved templates yet. Create one from Templates.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => useTemplate(template)}
                  className="flex w-full items-center justify-between rounded-md border border-[#dfe7df] bg-white px-3 py-3 text-left hover:bg-[#eef5ec] dark:border-white/10 dark:bg-[#18201a] dark:hover:bg-white/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{template.name}</span>
                    <span className="mt-0.5 block text-xs text-[#718074] dark:text-[#aebbb0]">{template.items.length} {template.items.length === 1 ? "food" : "foods"}</span>
                  </span>
                  <span className="ml-3 shrink-0 rounded-md bg-moss-600 px-3 py-1.5 text-xs font-bold text-white">Use</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-[#dfe7df] bg-[#f8faf7] p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold">Meal for new items</p><p className="text-xs text-[#718074] dark:text-[#aebbb0]">{initialMeal ? `Opened from ${MEAL_LABELS[initialMeal]}; new foods start there.` : "Choose where new foods should go."}</p></div><select value={defaultMeal} onChange={(event) => setDefaultMeal(event.target.value as Meal)} className="rounded-md border border-[#dbe5db] bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#18201a]">{meals.map((option) => <option key={option} value={option}>{mealInputLabels[option]}</option>)}</select></div>
      </div>
      {pending.length ? <div className="mt-4 space-y-2">
        {pending.map((item) => {
          const grams = Number(item.grams);
          const nutrients = Number.isFinite(grams) && grams > 0
            ? calculateNutrition(item.food, grams)
            : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
          return <div key={item.id} className="rounded-lg border border-[#dfe7df] bg-white p-3 dark:border-white/10 dark:bg-[#18201a]">
            <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-moss-50 font-bold text-moss-700 dark:bg-moss-500/15 dark:text-moss-100">{item.food.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.food.name}</p><p className="text-xs text-[#718074] dark:text-[#aebbb0]">{item.food.brand ? `${item.food.brand} · ` : ""}{item.food.source} · {item.food.measurementState.replace("_", " ")}</p></div><button onClick={() => setPending((current) => current.filter((value) => value.id !== item.id))} className="grid size-8 place-items-center rounded-md text-[#8b978d] hover:bg-red-50 hover:text-red-500" aria-label={`Remove ${item.food.name}`}><Trash2 size={16}/></button></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]"><label className="text-xs font-bold uppercase tracking-wide text-[#718074]">Weight (g)<input
              inputMode="decimal"
              type="number"
              min="1"
              step="0.1"
              placeholder="100"
              value={item.grams}
              onChange={(event) => updateItem(item.id, { grams: event.target.value })}
              className="mt-1 w-full rounded-md border border-[#dbe5db] bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-moss-500 placeholder:text-[#a8b2aa] focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-[#7f8d81]"
            /></label><label className="text-xs font-bold uppercase tracking-wide text-[#718074]">Meal<select value={item.meal} onChange={(event) => updateItem(item.id, { meal: event.target.value as Meal })} className="mt-1 w-full rounded-md border border-[#dbe5db] bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-moss-500 focus:ring-2 dark:border-white/10 dark:bg-white/5">{meals.map((option) => <option key={option} value={option}>{mealInputLabels[option]}</option>)}</select></label></div>
            <p className="mt-2 text-xs text-[#718074] dark:text-[#aebbb0]"><strong className="text-ink dark:text-white">{formatNumber(nutrients.calories)} kcal</strong> · P {formatNumber(nutrients.protein, 1)} · C {formatNumber(nutrients.carbs, 1)} · F {formatNumber(nutrients.fat, 1)}</p>
          </div>;
        })}
      </div> : <div className="mt-4 rounded-lg border border-dashed border-[#d9e3d9] p-7 text-center text-sm text-[#718074] dark:border-white/15 dark:text-[#aebbb0]">Search for a food above. You can add as many foods as you need before saving.</div>}
      {pending.length > 0 && <div className="mt-4 flex items-center justify-between rounded-lg bg-ink px-4 py-3 text-white"><div><p className="text-xs text-[#b8c8ba]">This batch</p><p className="font-bold">{pending.length} {pending.length === 1 ? "food" : "foods"} · {formatNumber(pendingTotals.calories)} kcal</p></div><button disabled={saving} onClick={() => void saveAll()} className="rounded-lg bg-moss-600 px-4 py-2.5 text-sm font-bold disabled:opacity-50">{saving ? "Saving…" : `Save ${pending.length} ${pending.length === 1 ? "food" : "foods"}`}</button></div>}
      {error && <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">{error}</p>}
    </div>
  </div>;
}
