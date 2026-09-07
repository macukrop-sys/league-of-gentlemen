import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPoints } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function MatchupToggle({
  week,
  homeTeam,
  awayTeam,
  homeAvg,
  awayAvg,
  selectedWinnerId,
  isOverridden,
  onPick,
}: {
  week: number;
  homeTeam: Team;
  awayTeam: Team;
  homeAvg: number;
  awayAvg: number;
  selectedWinnerId: string;
  isOverridden: boolean;
  onPick: (winnerId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground">Wk {week}</span>
      <SideButton team={homeTeam} avg={homeAvg} selected={selectedWinnerId === homeTeam.id} onClick={() => onPick(homeTeam.id)} />
      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">vs</span>
      <SideButton team={awayTeam} avg={awayAvg} selected={selectedWinnerId === awayTeam.id} onClick={() => onPick(awayTeam.id)} />
      {!isOverridden ? (
        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
          chalk
        </Badge>
      ) : (
        <Badge className="ml-auto shrink-0 text-[10px]">picked</Badge>
      )}
    </div>
  );
}

function SideButton({ team, avg, selected, onClick }: { team: Team; avg: number; selected: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("h-auto flex-1 flex-col items-start gap-0 px-2.5 py-1.5", !selected && "text-muted-foreground")}
    >
      <span className="max-w-full truncate text-xs font-semibold">{team.name}</span>
      <span className="text-[10px] font-normal opacity-70">avg {formatPoints(avg)}</span>
    </Button>
  );
}
