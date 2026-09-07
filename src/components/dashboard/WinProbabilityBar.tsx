import { cn } from "@/lib/utils";

export function WinProbabilityBar({
  homeLabel,
  awayLabel,
  homeWinProb,
}: {
  homeLabel: string;
  awayLabel: string;
  homeWinProb: number;
}) {
  const homePct = Math.round(homeWinProb * 100);
  const awayPct = 100 - homePct;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium">
        <span className={cn(homePct >= awayPct ? "text-primary" : "text-muted-foreground")}>
          {homeLabel} {homePct}%
        </span>
        <span className={cn(awayPct > homePct ? "text-primary" : "text-muted-foreground")}>
          {awayPct}% {awayLabel}
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-muted-foreground/40 transition-all duration-500" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}
