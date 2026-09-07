import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPoints } from "@/lib/utils";
import { estimateLiveFinal } from "@/lib/winProbability";
import type { Player, Position, Roster } from "@/lib/types";

/** Display order for starting slots — independent of whatever order the platform's API happens to return entries in (ESPN/Sleeper both return roster/draft order, not lineup order). */
const SLOT_ORDER: Partial<Record<Position, number>> = { QB: 0, RB: 1, WR: 2, TE: 3, FLEX: 4, DST: 5, K: 6 };

function statusLabel(player: Player): string {
  if (player.gameFinal) return "Final";
  if (player.gameInProgress) return "Live";
  return "";
}

function PlayerRow({
  slot,
  player,
  align,
  className = "",
}: {
  slot: string;
  player: Player | undefined;
  align: "left" | "right";
  className?: string;
}) {
  const live = player ? statusLabel(player) : "";
  return (
    <TableRow className={className}>
      <TableCell className={`w-10 text-xs font-semibold text-muted-foreground ${align === "right" ? "text-right" : ""}`}>{slot}</TableCell>
      <TableCell className={align === "right" ? "text-right" : ""}>
        {player ? (
          <>
            <div className="text-sm font-medium">{player.name}</div>
            <div className="text-xs text-muted-foreground">
              {player.position} &middot; {player.nflTeam}
              {live ? ` · ${live}` : ""}
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Empty</span>
        )}
      </TableCell>
      <TableCell className={`w-14 font-tabular text-sm text-muted-foreground ${align === "right" ? "text-left" : "text-right"}`}>
        {player ? formatPoints(estimateLiveFinal(player)) : "-"}
      </TableCell>
      <TableCell className={`w-14 font-tabular text-sm font-semibold ${align === "right" ? "text-left" : "text-right"}`}>
        {player ? (player.gameFinal || player.gameInProgress ? formatPoints(player.actualPoints) : "-") : "-"}
      </TableCell>
    </TableRow>
  );
}

export function RosterTable({ roster, align = "left" }: { roster: Roster; align?: "left" | "right" }) {
  const orderedStarters = roster.starters
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (SLOT_ORDER[a.s.slot] ?? 99) - (SLOT_ORDER[b.s.slot] ?? 99) || a.i - b.i)
    .map(({ s }) => s);

  const benchPlayers = roster.benchPlayerIds.map((id) => roster.players[id]).filter((p): p is Player => Boolean(p));

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead />
            <TableHead className={`w-14 ${align === "right" ? "text-left" : "text-right"}`}>Proj</TableHead>
            <TableHead className={`w-14 ${align === "right" ? "text-left" : "text-right"}`}>Live</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderedStarters.map((s, i) => (
            <PlayerRow key={i} slot={s.slot} player={s.playerId ? roster.players[s.playerId] : undefined} align={align} />
          ))}
        </TableBody>
      </Table>

      {benchPlayers.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2">
          <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${align === "right" ? "text-right" : ""}`}>Bench</p>
          <Table>
            <TableBody>
              {benchPlayers.map((player) => (
                <PlayerRow key={player.id} slot="BN" player={player} align={align} className="opacity-70" />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
