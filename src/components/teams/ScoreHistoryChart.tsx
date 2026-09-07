"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ScoreHistoryChart({ scoreHistory }: { scoreHistory: number[] }) {
  const data = scoreHistory.map((score, i) => ({ week: `W${i + 1}`, score }));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No completed weeks yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
