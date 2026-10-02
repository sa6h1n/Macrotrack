"use client";

import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  House,
  Leaf,
  Settings,
  UsersRound,
  CookingPot,
  ClipboardList,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nav = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/history", label: "History", icon: BookOpen },
  { href: "/app/together", label: "Together", icon: UsersRound },
  { href: "/app/foods", label: "Foods", icon: Leaf },
  { href: "/app/recipes", label: "Recipes", icon: CookingPot },
  { href: "/app/templates", label: "Templates", icon: ClipboardList },
] as const;

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [profileOpen, setProfileOpen] = useState(false);

  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    memberId: string;
    avatar: "🐐" | "⚡";
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, email, member_id, avatar")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile({
          name:
            data.name ??
            user.user_metadata?.name ??
            "Member",
          email:
            data.email ??
            user.email ??
            "",
          memberId:
            data.member_id ??
            "MTX-UNKNOWN",
          avatar:
            data.avatar === "🐐"
              ? "🐐"
              : "⚡",
        });
      }
    }

    void loadProfile();
  }, []);

  const avatar = profile?.avatar ?? "⚡";

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#17191d] transition-colors dark:bg-[#0b0d10] dark:text-[#f5f7fa]">

      {/* ====================================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ====================================================== */}

      <aside className="fixed inset-y-0 hidden w-64 border-r border-[#e3e5e9] bg-white px-4 py-5 dark:border-white/[0.07] dark:bg-[#111318] lg:block">

        {/* MacroTrack / Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setProfileOpen((value) => !value)
            }
            className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#f3f4f6] dark:hover:bg-white/[0.05]"
            aria-expanded={profileOpen}
            aria-label="Open profile"
          >
            <span
              className={cn(
                "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl",
                "transition-all duration-300",
                "group-hover:scale-105 group-hover:rotate-2",
                "group-hover:drop-shadow-[0_0_12px_rgba(255,185,40,0.28)]",
                profileOpen &&
                  "scale-105 rotate-2 drop-shadow-[0_0_12px_rgba(255,185,40,0.28)]",
              )}
            >
              <Image
                src="/macrotrack-lightning.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  `block truncate text-[18px] font-bold tracking-[-0.03em] ${spaceGrotesk.className}`, 
                  "transition-colors duration-300",
                  "group-hover:text-[#6957d8]",
                  profileOpen &&
                    "text-[#6957d8]",
                  "dark:group-hover:text-[#a99fff]",
                  profileOpen &&
                    "dark:text-[#a99fff]",
                )}
              >
                MacroTrack
              </span>

              <span className="block text-[11px] font-medium text-[#858b95]">
                Personal nutrition
              </span>
            </span>

            <ChevronDown
              size={17}
              className={cn(
                "shrink-0 text-[#8a9099] transition-transform duration-300",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {/* DESKTOP PROFILE MENU */}
          {profileOpen && (
            <div className="absolute left-0 right-0 top-[58px] z-50 rounded-2xl border border-[#e1e4e8] bg-white p-3 shadow-2xl dark:border-white/[0.08] dark:bg-[#181b21]">

              <div className="flex items-center gap-3 rounded-xl bg-[#f5f6f8] p-3 dark:bg-white/[0.05]">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm dark:bg-[#252932]">
                  {avatar}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {profile?.name ?? "Member"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-[#858b95]">
                    {profile?.email ?? ""}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#e5e7eb] px-3 py-2.5 dark:border-white/[0.07]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9298a1]">
                  MacroTrack ID
                </p>

                <p className="mt-1 font-mono text-sm font-bold tracking-wider text-[#6957d8] dark:text-[#9b8cff]">
                  {profile?.memberId ?? "MTX-UNKNOWN"}
                </p>
              </div>

              <div className="mt-2">
                <Link
                  href="/app/profile"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#555b65] transition hover:bg-[#f3f4f6] dark:text-[#c5cad2] dark:hover:bg-white/[0.05]"
                >
                  <Settings size={17} />
                  Profile
                </Link>
              </div>

              <form
                action={signOut}
                className="mt-1"
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#555b65] transition hover:bg-[#fff1f1] hover:text-[#d94c4c] dark:text-[#c5cad2] dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <LogOut size={17} />
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>

        {/* DESKTOP NAV LABEL */}
        <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9298a1]">
          Your space
        </p>

        {/* DESKTOP NAV */}
        <nav className="mt-3 space-y-1">
          {nav.map(
            ({
              href,
              label,
              icon: Icon,
            }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                  pathname === href
                    ? "bg-[#eeecff] text-[#5f4ec7] dark:bg-[#6957d8]/15 dark:text-[#b7aeff]"
                    : "text-[#626872] hover:bg-[#f3f4f6] dark:text-[#aeb4bf] dark:hover:bg-white/[0.05]",
                )}
              >
                <Icon size={19} />
                {label}
              </Link>
            ),
          )}
        </nav>

        {/* PROGRESS */}
        <Link
          href="/app/progress"
          className={cn(
            "mt-7 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
            pathname === "/app/progress"
              ? "bg-[#eeecff] text-[#5f4ec7] dark:bg-[#6957d8]/15 dark:text-[#b7aeff]"
              : "text-[#626872] hover:bg-[#f3f4f6] dark:text-[#aeb4bf] dark:hover:bg-white/[0.05]",
          )}
        >
          <BarChart3 size={19} />
          Progress
        </Link>

        {/* SIDEBAR FOOTER */}
        <div className="absolute inset-x-4 bottom-5 rounded-xl border border-[#e5e7eb] bg-[#f7f7f8] p-4 dark:border-white/[0.06] dark:bg-white/[0.035]">
          <p className="text-sm font-semibold">
            Small steps count.
          </p>

          <p className="mt-1 text-xs text-[#858b95]">
            Log one meal at a time.
          </p>
        </div>
      </aside>

      {/* ====================================================== */}
      {/* MOBILE TOP BAR */}
      {/* ====================================================== */}

      <header className="relative flex items-center border-b border-[#e3e5e9] bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-[#111318] lg:hidden">

        {/* ================================================== */}
        {/* MACROTRACK = PROFILE BUTTON */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={() =>
            setProfileOpen((value) => !value)
          }
          className={cn(
            "group flex items-center gap-2.5 rounded-xl px-1.5 py-1",
            "transition-all duration-300",
            "hover:bg-[#f3f4f6] dark:hover:bg-white/[0.05]",
            profileOpen &&
              "bg-[#f3f4f6] dark:bg-white/[0.05]",
          )}
          aria-label="Open profile"
          aria-expanded={profileOpen}
        >
          {/* LIGHTNING */}
          <span
            className={cn(
              "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg",
              "transition-all duration-300",
              "group-hover:scale-105",
              "group-hover:rotate-2",
              "group-hover:drop-shadow-[0_0_12px_rgba(255,185,40,0.28)]",
              profileOpen &&
                "scale-105 rotate-2 drop-shadow-[0_0_12px_rgba(255,185,40,0.28)]",
            )}
          >
            <Image
              src="/macrotrack-lightning.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </span>

          {/* MACROTRACK TEXT */}
          <span
            className={cn(
              `text-[18px] font-bold tracking-[-0.03em] ${spaceGrotesk.className}`,
              "transition-colors duration-300",
              "group-hover:text-[#6957d8]",
              profileOpen &&
                "text-[#6957d8]",
              "dark:group-hover:text-[#a99fff]",
              profileOpen &&
                "dark:text-[#a99fff]",
            )}
          >
            MacroTrack
          </span>

          {/* CHEVRON */}
          <ChevronDown
            size={16}
            className={cn(
              "ml-0.5 text-[#8a9099] transition-transform duration-300",
              profileOpen && "rotate-180",
            )}
          />
        </button>

        {/* ================================================== */}
        {/* MOBILE PROFILE MENU */}
        {/* ================================================== */}

        {profileOpen && (
          <div className="absolute left-4 right-4 top-[60px] z-50 rounded-2xl border border-[#e1e4e8] bg-white p-3 shadow-2xl dark:border-white/[0.08] dark:bg-[#181b21]">

            {/* USER */}
            <div className="flex items-center gap-3 rounded-xl bg-[#f5f6f8] p-3 dark:bg-white/[0.05]">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm dark:bg-[#252932]">
                {avatar}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {profile?.name ?? "Member"}
                </p>

                <p className="truncate text-xs text-[#858b95]">
                  {profile?.email ?? ""}
                </p>
              </div>
            </div>

            {/* MEMBER ID */}
            <div className="mt-3 rounded-xl border border-[#e5e7eb] px-3 py-2.5 dark:border-white/[0.07]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9298a1]">
                MacroTrack ID
              </p>

              <p className="mt-1 font-mono text-sm font-bold tracking-wider text-[#6957d8] dark:text-[#9b8cff]">
                {profile?.memberId ?? "MTX-UNKNOWN"}
              </p>
            </div>

            {/* PROFILE */}
            <Link
              href="/app/profile"
              onClick={() =>
                setProfileOpen(false)
              }
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:bg-[#f3f4f6] dark:hover:bg-white/[0.05]"
            >
              <Settings size={17} />
              Profile
            </Link>

            {/* LOG OUT */}
            <form
              action={signOut}
              className="mt-1"
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#d94c4c] transition hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Log out
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ====================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================== */}

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-7 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-9">
        {children}
      </main>

      {/* ====================================================== */}
      {/* MOBILE BOTTOM NAVIGATION */}
      {/* ====================================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#e3e5e9] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/[0.07] dark:bg-[#111318]/95 lg:hidden">

        {nav.map(
          ({
            href,
            label,
            icon: Icon,
          }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-semibold",
                pathname === href
                  ? "text-[#6957d8] dark:text-[#a99fff]"
                  : "text-[#858b95] dark:text-[#8f96a2]",
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}