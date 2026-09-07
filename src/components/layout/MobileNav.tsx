"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Newspaper, Vote, MoreHorizontal, Radio, Shield, BarChart3, Dices, SlidersHorizontal, X } from "lucide-react";

/** Always visible in the bottom bar — the sections people check most often, week to week. */
const PRIMARY_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/matchups", label: "Matchups", icon: Users },
  { href: "/recap", label: "Recap", icon: Newspaper },
  { href: "/polls", label: "Polls", icon: Vote },
];

/** Tucked behind "More" — deeper tools people reach for occasionally rather than every visit. */
const MORE_ITEMS = [
  { href: "/live", label: "Live Analytics", icon: Radio },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/stats", label: "Advanced Stats", icon: BarChart3 },
  { href: "/simulator", label: "Playoff Simulator", icon: Dices },
  { href: "/playoff-machine", label: "Playoff Machine", icon: SlidersHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));
  const moreActive = MORE_ITEMS.some((item) => isActive(item.href));

  // Close the "More" panel whenever the route changes (a nav link inside it was followed).
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Close on outside click/tap.
  useEffect(() => {
    if (!moreOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [moreOpen]);

  return (
    <div className="md:hidden">
      {moreOpen ? (
        <div
          ref={panelRef}
          className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 rounded-lg border border-border bg-card p-2 shadow-glow"
        >
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">More</p>
            <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu" className="p-1 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md px-2 py-3 text-center text-[11px] font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
            moreOpen || moreActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </button>
      </nav>
    </div>
  );
}
