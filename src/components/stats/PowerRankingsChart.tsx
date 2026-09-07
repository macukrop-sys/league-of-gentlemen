"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PowerRanking, Team } from "@/lib/types";

export function PowerRankingsChart({ rankings, teamsById }: { rankings: PowerRanking[]; teamsById: Map<string, Team> }) {
  const data = [...rankings]
    .sort((a, b) => b.score - a.score)
    .map((r) => ({
      name: teamsById.get(r.teamId)?.name.replace("The ", "") ?? r.teamId,
      score: r.score,
    }));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList dataKey="score" position="right" style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
