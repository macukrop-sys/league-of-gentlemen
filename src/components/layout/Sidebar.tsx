"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Radio, Users, Shield, BarChart3, Dices, SlidersHorizontal, Crown } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/live", label: "Live Analytics", icon: Radio },
  { href: "/matchups", label: "Matchups", icon: Users },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/stats", label: "Advanced Stats", icon: BarChart3 },
  { href: "/simulator", label: "Playoff Simulator", icon: Dices },
  { href: "/playoff-machine", label: "Playoff Machine", icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 backdrop-blur-sm md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Crown className="h-6 w-6 text-primary" />
        <div>
          <p className="font-display text-sm font-semibold leading-tight">The League of</p>
          <p className="font-display text-sm font-semibold leading-tight text-primary">Gentlemen</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Season 2025 &middot; est. via gentlemen&apos;s agreement
      </div>
    </aside>
  );
}
