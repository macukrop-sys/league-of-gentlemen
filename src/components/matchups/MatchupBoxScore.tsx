import { Card } from "@/components/ui/card";
import { RosterTable } from "./RosterTable";
import { formatPoints } from "@/lib/utils";
import type { LiveMatchupView } from "@/lib/api-types";
import type { Roster } from "@/lib/types";
import { ChevronDown } from "lucide-react";

export function MatchupBoxScore({
  matchup,
  homeRoster,
  awayRoster,
  defaultOpen = false,
}: {
  matchup: LiveMatchupView;
  homeRoster?: Roster;
  awayRoster?: Roster;
  defaultOpen?: boolean;
}) {
  if (!matchup.homeTeam || !matchup.awayTeam) return null;
  const homeWinning = matchup.homeScore >= matchup.awayScore;

  return (
    <Card className="overflow-hidden">
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-accent/30">
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className={homeWinning ? "font-semibold" : "text-muted-foreground"}>
              <div className="text-sm">{matchup.homeTeam.name}</div>
              <div className="font-tabular text-xl">{formatPoints(matchup.homeScore)}</div>
            </div>
            <span className="text-xs text-muted-foreground">vs</span>
            <div className={`text-right ${!homeWinning ? "font-semibold" : "text-muted-foreground"}`}>
              <div className="text-sm">{matchup.awayTeam.name}</div>
              <div className="font-tabular text-xl">{formatPoints(matchup.awayScore)}</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-6 border-t border-border px-5 py-4 md:grid-cols-2">
          {homeRoster ? <RosterTable roster={homeRoster} /> : <p className="text-sm text-muted-foreground">No roster data for this week.</p>}
          {awayRoster ? <RosterTable roster={awayRoster} align="right" /> : <p className="text-sm text-muted-foreground">No roster data for this week.</p>}
        </div>
      </details>
    </Card>
  );
}
