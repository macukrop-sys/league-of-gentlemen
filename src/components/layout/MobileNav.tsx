"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Radio, Users, Shield, BarChart3, Dices, SlidersHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/matchups", label: "Matchups", icon: Users },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/simulator", label: "Simulator", icon: Dices },
  { href: "/playoff-machine", label: "Machine", icon: SlidersHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
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
    </nav>
  );
}
