import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WinProbabilityBar } from "./WinProbabilityBar";
import type { LiveMatchupView } from "@/lib/api-types";
import type { OptimalLineupResult } from "@/lib/types";
import { formatPoints } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

function TeamSide({
  name,
  owner,
  score,
  projectedFinal,
  optimal,
  align,
}: {
  name: string;
  owner: string;
  score: number;
  projectedFinal?: number;
  optimal?: OptimalLineupResult;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-sm font-semibold leading-tight">{name}</p>
      <p className="text-xs text-muted-foreground">{owner}</p>
      <p className="mt-1 font-tabular text-2xl font-bold">{formatPoints(score)}</p>
      {projectedFinal !== undefined ? (
        <p className="font-tabular text-[11px] text-muted-foreground">proj. final {formatPoints(projectedFinal)}</p>
      ) : null}
      {optimal && optimal.pointsLeftOnBench > 0.5 ? (
        <Badge variant="destructive" className={align === "right" ? "ml-auto mt-1 gap-1" : "mt-1 gap-1"}>
          <TrendingUp className="h-3 w-3" />
          +{formatPoints(optimal.pointsLeftOnBench)} on bench
        </Badge>
      ) : null}
    </div>
  );
}

export function MatchupCard({
  matchup,
  optimalByTeamId,
}: {
  matchup: LiveMatchupView;
  optimalByTeamId: Map<string, OptimalLineupResult>;
}) {
  if (!matchup.homeTeam || !matchup.awayTeam) return null;
  const homeOptimal = optimalByTeamId.get(matchup.homeTeam.id);
  const awayOptimal = optimalByTeamId.get(matchup.awayTeam.id);

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <TeamSide
            name={matchup.homeTeam.name}
            owner={matchup.homeTeam.ownerName}
            score={matchup.homeScore}
            projectedFinal={matchup.winProbability?.homeProjectedFinal}
            optimal={homeOptimal}
            align="left"
          />
          <span className="pt-6 text-xs font-medium text-muted-foreground">VS</span>
          <TeamSide
            name={matchup.awayTeam.name}
            owner={matchup.awayTeam.ownerName}
            score={matchup.awayScore}
            projectedFinal={matchup.winProbability?.awayProjectedFinal}
            optimal={awayOptimal}
            align="right"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {matchup.winProbability ? (
          <WinProbabilityBar
            homeLabel={matchup.homeTeam.name.split(" ").slice(-1)[0] ?? matchup.homeTeam.name}
            awayLabel={matchup.awayTeam.name.split(" ").slice(-1)[0] ?? matchup.awayTeam.name}
            homeWinProb={matchup.winProbability.homeWinProb}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
