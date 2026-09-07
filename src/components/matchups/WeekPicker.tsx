import Link from "next/link";
import { cn } from "@/lib/utils";

export function WeekPicker({ regularSeasonWeeks, currentWeek, selectedWeek }: { regularSeasonWeeks: number; currentWeek: number; selectedWeek: number }) {
  const weeks = Array.from({ length: regularSeasonWeeks }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap gap-1.5">
      {weeks.map((week) => {
        const isSelected = week === selectedWeek;
        const isCurrent = week === currentWeek;
        return (
          <Link
            key={week}
            href={`/matchups?week=${week}`}
            className={cn(
              "relative flex h-8 w-9 items-center justify-center rounded-md border text-xs font-medium font-tabular transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {week}
            {isCurrent ? (
              <span className={cn("absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-success")} />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
