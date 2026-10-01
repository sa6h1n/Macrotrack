"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Link2, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const supabase = useMemo(() => createClient(), []);
  const [token, setToken] = useState("");
  const [group, setGroup] = useState<{ id: string; name: string; member_count: number } | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const resolved = await params;
      if (!active) return;
      setToken(resolved.token);
      const [{ data: publicGroup, error: groupError }, { data: userData }] = await Promise.all([
        supabase.rpc("get_public_group_by_token", { join_token_input: resolved.token }),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      setGroup((publicGroup?.[0] as { id: string; name: string; member_count: number } | undefined) ?? null);
      setSignedIn(Boolean(userData.user));
      if (groupError) setError(groupError.message);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [params, supabase]);

  async function join() {
    if (!token) return;
    setJoining(true);
    setError("");
    setMessage("");
    const { data, error: joinError } = await supabase.rpc("join_group_by_link", { join_token_input: token });
    setJoining(false);
    if (joinError) {
      setError(joinError.message);
      return;
    }
    const joined = data?.[0];
    setMessage(`You're in ${joined?.group_name ?? group?.name ?? "the group"}.`);
    setGroup((current) => current ? { ...current, member_count: current.member_count + 1 } : current);
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f7faf6] p-6 dark:bg-[#101612]"><p className="font-semibold text-[#718074]">Loading group…</p></main>;
  }

  if (!group) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7faf6] p-6 dark:bg-[#101612]">
        <section className="w-full max-w-md rounded-2xl border border-[#dfe7df] bg-white p-7 shadow-xl dark:border-white/10 dark:bg-[#18201a]">
          <div className="grid size-12 place-items-center rounded-xl bg-moss-600 text-white"><Link2 size={22} /></div>
          <h1 className="mt-5 text-2xl font-black">This join link is unavailable</h1>
          <p className="mt-2 text-sm text-[#718074]">It may be invalid, expired, or the group owner may have regenerated the link.</p>
          <Link href="/" className="mt-5 inline-flex rounded-lg bg-moss-600 px-4 py-3 text-sm font-bold text-white">Open MacroTrack</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7faf6] p-6 dark:bg-[#101612]">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe7df] bg-white p-7 shadow-xl dark:border-white/10 dark:bg-[#18201a]">
        <div className="grid size-12 place-items-center rounded-xl bg-moss-600 text-white"><UsersRound size={22} /></div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-moss-700 dark:text-moss-300">You&apos;re invited to track together</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{group.name}</h1>
        <p className="mt-2 text-sm text-[#718074]">{group.member_count} {group.member_count === 1 ? "member" : "members"}. Your nutrition targets and details stay private according to your sharing settings.</p>
        {message && <p className="mt-5 rounded-lg bg-moss-50 px-3 py-3 text-sm font-semibold text-moss-800 dark:bg-moss-500/10 dark:text-moss-100">{message}</p>}
        {error && <p className="mt-5 rounded-lg bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-700 dark:text-red-200">{error}</p>}
        {signedIn ? (
          <button type="button" onClick={() => void join()} disabled={joining || Boolean(message)} className="mt-6 w-full rounded-lg bg-moss-600 px-4 py-3.5 font-bold text-white disabled:opacity-50">
            {joining ? "Joining…" : message ? "Joined group" : "Join group"}
          </button>
        ) : (
          <div className="mt-6 grid gap-2">
            <Link href={`/login?next=${encodeURIComponent(`/join/${token}`)}`} className="w-full rounded-lg bg-moss-600 px-4 py-3.5 text-center font-bold text-white">Sign in to join</Link>
            <Link href={`/signup?next=${encodeURIComponent(`/join/${token}`)}`} className="w-full rounded-lg border px-4 py-3.5 text-center font-bold">Create an account</Link>
          </div>
        )}
        <p className="mt-5 text-center text-xs text-[#718074]">MacroTrack · private nutrition tracking</p>
      </section>
    </main>
  );
}
