"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LuckIndexEntry, Team } from "@/lib/types";

export function LuckIndexChart({ entries, teamsById }: { entries: LuckIndexEntry[]; teamsById: Map<string, Team> }) {
  const data = [...entries]
    .sort((a, b) => b.luckIndex - a.luckIndex)
    .map((e) => ({
      name: teamsById.get(e.teamId)?.name.replace("The ", "") ?? e.teamId,
      luckIndex: e.luckIndex,
    }));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine x={0} stroke="hsl(var(--border))" />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          formatter={(value: number) => [value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2), "Luck Index"]}
        />
        <Bar dataKey="luckIndex" radius={[4, 4, 4, 4]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.luckIndex >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
