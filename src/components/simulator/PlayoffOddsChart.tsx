"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationResult, Team } from "@/lib/types";

export function PlayoffOddsChart({ results, teamsById }: { results: SimulationResult[]; teamsById: Map<string, Team> }) {
  const data = [...results]
    .sort((a, b) => b.playoffOdds - a.playoffOdds)
    .map((r) => ({
      name: teamsById.get(r.teamId)?.name.replace("The ", "") ?? r.teamId,
      Playoffs: +(r.playoffOdds * 100).toFixed(1),
      Division: +(r.divisionOdds * 100).toFixed(1),
      Bye: +(r.byeOdds * 100).toFixed(1),
    }));

  return (
    <ResponsiveContainer width="100%" height={460}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <YAxis dataKey="name" type="category" width={150} tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          formatter={(value: number) => `${value}%`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Playoffs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={10} />
        <Bar dataKey="Division" fill="hsl(142 65% 45%)" radius={[0, 4, 4, 0]} maxBarSize={10} />
        <Bar dataKey="Bye" fill="hsl(260 70% 65%)" radius={[0, 4, 4, 0]} maxBarSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
