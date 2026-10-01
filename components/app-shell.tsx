"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, House, Leaf, Settings, UsersRound, CookingPot, ClipboardList, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/history", label: "History", icon: BookOpen },
  { href: "/app/together", label: "Together", icon: UsersRound },
  { href: "/app/foods", label: "Foods", icon: Leaf },
  { href: "/app/recipes", label: "Recipes", icon: CookingPot },
  { href: "/app/templates", label: "Templates", icon: ClipboardList },
  { href: "/app/profile", label: "Profile", icon: Settings }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("macrotrack-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
    // Keep the first render hydration-safe; the actual theme is applied above.
    window.setTimeout(() => setDark(isDark), 0);
  }, []);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("macrotrack-theme", next ? "dark" : "light");
    setDark(next);
  }

  return <div className="min-h-screen bg-canvas text-ink transition-colors dark:bg-[#101612] dark:text-[#eef5ef]">
    <aside className="fixed inset-y-0 hidden w-64 border-r border-[#dfe7df] bg-white px-5 py-7 dark:border-white/10 dark:bg-[#151c17] lg:block">
      <Link href="/app" className="flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-moss-600 text-lg font-black text-white">M</span><span className="text-xl font-bold tracking-tight">MacroTrack</span></Link>
      <p className="mt-12 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b897e]">Your space</p>
      <nav className="mt-3 space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition", pathname === href ? "bg-moss-50 text-moss-700 dark:bg-moss-500/15 dark:text-moss-100" : "text-[#59675d] hover:bg-[#f2f5f1] dark:text-[#b9c6bb] dark:hover:bg-white/5")}><Icon size={19}/>{label}</Link>)}</nav>
      <Link href="/app/progress" className="mt-7 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#59675d] hover:bg-[#f2f5f1] dark:text-[#b9c6bb] dark:hover:bg-white/5"><BarChart3 size={19}/>Progress</Link>
      <button type="button" onClick={toggleTheme} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#59675d] hover:bg-[#f2f5f1] dark:text-[#b9c6bb] dark:hover:bg-white/5" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
        {dark ? <Sun size={19}/> : <Moon size={19}/>}
        {dark ? "Light mode" : "Dark mode"}
      </button>
      <div className="absolute inset-x-5 bottom-7 rounded-lg bg-moss-50 p-4 text-sm text-moss-700 dark:bg-moss-500/15 dark:text-moss-100"><p className="font-semibold">Small steps count.</p><p className="mt-1 text-xs opacity-80">Log one meal at a time.</p></div>
    </aside>
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-7 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-9">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#dfe7df] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-[#151c17]/95 lg:hidden">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-semibold", pathname === href ? "text-moss-600" : "text-[#7b897e] dark:text-[#a2b0a5]")}><Icon size={20}/><span>{label}</span></Link>)}</nav>
  </div>;
}
