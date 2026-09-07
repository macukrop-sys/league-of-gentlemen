import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatPoints } from "@/lib/utils";
import type { Roster } from "@/lib/types";

function effectivePoints(gameFinal: boolean, gameInProgress: boolean, actual: number, projected: number) {
  return gameFinal || gameInProgress ? actual : projected;
}

export function RosterTable({ roster, align = "left" }: { roster: Roster; align?: "left" | "right" }) {
  const starterRows = roster.starters.map((s) => ({ slot: s.slot, player: s.playerId ? roster.players[s.playerId] : undefined }));
  const benchPlayers = roster.benchPlayerIds.map((id) => roster.players[id]).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div>
      <Table>
        <TableBody>
          {starterRows.map(({ slot, player }, i) => (
            <TableRow key={i}>
              <TableCell className={`w-10 text-xs font-semibold text-muted-foreground ${align === "right" ? "text-right" : ""}`}>{slot}</TableCell>
              <TableCell className={align === "right" ? "text-right" : ""}>
                {player ? (
                  <>
                    <div className="text-sm font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.position} &middot; {player.nflTeam}
                      {player.gameFinal ? " · Final" : player.gameInProgress ? " · Live" : ""}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Empty</span>
                )}
              </TableCell>
              <TableCell className={`w-16 font-tabular text-sm font-semibold ${align === "right" ? "text-left" : "text-right"}`}>
                {player ? formatPoints(effectivePoints(player.gameFinal, player.gameInProgress, player.actualPoints, player.projectedPoints)) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {benchPlayers.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2">
          <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${align === "right" ? "text-right" : ""}`}>Bench</p>
          <Table>
            <TableBody>
              {benchPlayers.map((player) => (
                <TableRow key={player.id} className="opacity-70">
                  <TableCell className={`w-10 text-xs font-semibold text-muted-foreground ${align === "right" ? "text-right" : ""}`}>BN</TableCell>
                  <TableCell className={align === "right" ? "text-right" : ""}>
                    <div className="text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.position} &middot; {player.nflTeam}</div>
                  </TableCell>
                  <TableCell className={`w-16 font-tabular text-sm ${align === "right" ? "text-left" : "text-right"}`}>
                    {formatPoints(effectivePoints(player.gameFinal, player.gameInProgress, player.actualPoints, player.projectedPoints))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
