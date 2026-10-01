"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, Loader2, ShieldCheck, X } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/client";

type Goal = "maintain" | "lose" | "gain";

type Profile = {
  name: string;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  goal: Goal;
  share_calories: boolean;
  share_protein: boolean;
  share_carbs: boolean;
  share_fat: boolean;
  share_weight: boolean;
  share_meal_details: boolean;
  share_workout_status: boolean;
};

const emptyProfile: Profile = {
  name: "",
  age: null,
  height_cm: null,
  current_weight_kg: null,
  calorie_target: 2200,
  protein_target: 120,
  carb_target: 260,
  fat_target: 70,
  goal: "maintain",
  share_calories: true,
  share_protein: true,
  share_carbs: false,
  share_fat: false,
  share_weight: false,
  share_meal_details: false,
  share_workout_status: true,
};

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [editingPrivacy, setEditingPrivacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          "name,age,height_cm,current_weight_kg,calorie_target,protein_target,carb_target,fat_target,goal,share_calories,share_protein,share_carbs,share_fat,share_weight,share_meal_details,share_workout_status"
        )
        .eq("user_id", userData.user.id)
        .single();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else if (data) {
        const next = data as Profile;
        setProfile(next);
        setDraft(next);
      }
      setLoading(false);
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [supabase]);

  const isEditing = editingAbout || editingTargets || editingPrivacy;

  function updateDraft<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
  }

  function cancelEdits() {
    setDraft(profile);
    setEditingAbout(false);
    setEditingTargets(false);
    setEditingPrivacy(false);
    setMessage(null);
    setError(null);
  }

  async function saveChanges() {
    setSaving(true);
    setMessage(null);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("You need to be signed in to save changes.");
      setSaving(false);
      return;
    }

    const payload = {
      name: draft.name.trim() || "Member",
      age: draft.age,
      height_cm: draft.height_cm,
      current_weight_kg: draft.current_weight_kg,
      calorie_target: draft.calorie_target,
      protein_target: draft.protein_target,
      carb_target: draft.carb_target,
      fat_target: draft.fat_target,
      goal: draft.goal,
      share_calories: draft.share_calories,
      share_protein: draft.share_protein,
      share_carbs: draft.share_carbs,
      share_fat: draft.share_fat,
      share_weight: draft.share_weight,
      share_meal_details: draft.share_meal_details,
      share_workout_status: draft.share_workout_status,
    };

    const { data, error: saveError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", userData.user.id)
      .select(
        "name,age,height_cm,current_weight_kg,calorie_target,protein_target,carb_target,fat_target,goal,share_calories,share_protein,share_carbs,share_fat,share_weight,share_meal_details,share_workout_status"
      )
      .single();

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    const next = data as Profile;
    setProfile(next);
    setDraft(next);
    setEditingAbout(false);
    setEditingTargets(false);
    setEditingPrivacy(false);
    setMessage("Changes saved.");
    setSaving(false);
  }

  const inputClass = (editable: boolean) =>
    `mt-1.5 w-full rounded-md border px-3 py-2.5 outline-none transition ${
      editable
        ? "border-[#b8cdb9] bg-white focus:ring-2 focus:ring-[#477648]/30 dark:border-white/20 dark:bg-white/5"
        : "cursor-default border-[#e1e4e8] bg-[#f3f6f3] text-[#68746a] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#aeb4bf]"
    }`;

  if (loading) {
    return (
      <>
        <SectionHeading eyebrow="Your settings" title="Profile" description="Targets are personal. MacroTrack does not provide medical advice." />
        <div className="mt-7 flex items-center gap-2 text-sm text-[#858b95]">
          <Loader2 size={16} className="animate-spin" /> Loading profile…
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeading eyebrow="Your settings" title="Profile" description="Targets are personal. MacroTrack does not provide medical advice." />

      {error && <div className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mt-5 rounded-lg border border-[#b8cdb9] bg-[#edf5ed] px-4 py-3 text-sm text-[#356239]">{message}</div>}

      <section className="mt-7 rounded-lg border border-[#e1e4e8] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181b21]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold">About you</h2>
            <p className="mt-1 text-sm text-[#858b95] dark:text-[#aeb4bf]">Your personal details.</p>
          </div>
          {!editingAbout ? (
            <button type="button" onClick={() => { setEditingAbout(true); setMessage(null); }} className="inline-flex items-center gap-2 rounded-md border border-[#e1e4e8] px-3 py-2 text-sm font-semibold hover:bg-[#f3f6f3] dark:border-white/10 dark:hover:bg-white/5">
              <Edit3 size={15} /> Edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Name<input value={draft.name} disabled={!editingAbout} onChange={(e) => updateDraft("name", e.target.value)} className={inputClass(editingAbout)} /></label>
          <label className="text-sm font-semibold">Age<input value={draft.age ?? ""} disabled={!editingAbout} onChange={(e) => updateDraft("age", numberOrNull(e.target.value))} inputMode="numeric" className={inputClass(editingAbout)} /></label>
          <label className="text-sm font-semibold">Height (cm)<input value={draft.height_cm ?? ""} disabled={!editingAbout} onChange={(e) => updateDraft("height_cm", numberOrNull(e.target.value))} inputMode="decimal" className={inputClass(editingAbout)} /></label>
          <label className="text-sm font-semibold">Current weight (kg)<input value={draft.current_weight_kg ?? ""} disabled={!editingAbout} onChange={(e) => updateDraft("current_weight_kg", numberOrNull(e.target.value))} inputMode="decimal" className={inputClass(editingAbout)} /></label>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-[#e1e4e8] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181b21]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold">Daily targets</h2>
            <p className="mt-1 text-sm text-[#858b95] dark:text-[#aeb4bf]">Set the targets you want to follow.</p>
          </div>
          {!editingTargets ? (
            <button type="button" onClick={() => { setEditingTargets(true); setMessage(null); }} className="inline-flex items-center gap-2 rounded-md border border-[#e1e4e8] px-3 py-2 text-sm font-semibold hover:bg-[#f3f6f3] dark:border-white/10 dark:hover:bg-white/5">
              <Edit3 size={15} /> Edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            ["calorie_target", "Calories", "kcal"],
            ["protein_target", "Protein", "g"],
            ["carb_target", "Carbs", "g"],
            ["fat_target", "Fat", "g"],
          ].map(([key, label, unit]) => (
            <label key={key} className="text-sm font-semibold">{label}
              <span className="relative mt-1.5 block">
                <input value={draft[key as keyof Profile] as number} disabled={!editingTargets} onChange={(e) => updateDraft(key as keyof Profile, numberOrNull(e.target.value) ?? 0)} inputMode="decimal" className={inputClass(editingTargets) + " pr-10"} />
                <span className="pointer-events-none absolute right-3 top-3 text-xs text-[#858b95]">{unit}</span>
              </span>
            </label>
          ))}
        </div>

        <label className="mt-4 block max-w-xs text-sm font-semibold">Goal
          <select value={draft.goal} disabled={!editingTargets} onChange={(e) => updateDraft("goal", e.target.value as Goal)} className={inputClass(editingTargets)}>
            <option value="maintain">Maintain</option>
            <option value="lose">Lose</option>
            <option value="gain">Gain</option>
          </select>
        </label>
      </section>

      <section className="mt-4 rounded-lg border border-[#e1e4e8] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181b21]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-moss-600" /><h2 className="font-bold">Group privacy</h2></div>
            <p className="mt-1 text-sm text-[#6b796e] dark:text-[#aeb4bf]">Only group members can see the items you choose to share.</p>
          </div>
          {!editingPrivacy ? (
            <button type="button" onClick={() => { setEditingPrivacy(true); setMessage(null); }} className="inline-flex items-center gap-2 rounded-md border border-[#e1e4e8] px-3 py-2 text-sm font-semibold hover:bg-[#f3f6f3] dark:border-white/10 dark:hover:bg-white/5">
              <Edit3 size={15} /> Edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 divide-y divide-[#e9ebef] dark:divide-white/10">
          {[
            ["share_calories", "Share calories"],
            ["share_protein", "Share protein"],
            ["share_carbs", "Share carbs"],
            ["share_fat", "Share fat"],
            ["share_weight", "Share weight"],
            ["share_meal_details", "Share meal details"],
            ["share_workout_status", "Share workout status"],
          ].map(([key, label]) => {
            const field = key as keyof Profile;
            return (
              <label key={key} className={`flex items-center justify-between py-3 text-sm font-semibold ${editingPrivacy ? "cursor-pointer" : "cursor-default"}`}>
                <span>{label}</span>
                <input type="checkbox" disabled={!editingPrivacy} checked={Boolean(draft[field])} onChange={(e) => updateDraft(field, e.target.checked)} className="size-5 accent-[#477648]" />
              </label>
            );
          })}
        </div>
      </section>

      {isEditing && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-end gap-3 rounded-lg border border-[#e1e4e8] bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#181b21]/95">
          <button type="button" onClick={cancelEdits} disabled={saving} className="inline-flex items-center gap-2 rounded-md border border-[#e1e4e8] px-4 py-2.5 text-sm font-bold dark:border-white/10">
            <X size={16} /> Cancel
          </button>
          <button type="button" onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-moss-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </>
  );
}
