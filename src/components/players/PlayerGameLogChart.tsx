"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PlayerGameLogChart({ gameLog }: { gameLog: { week: number; actualPoints: number; projectedPoints: number }[] }) {
  const data = gameLog.map((g) => ({ week: `W${g.week}`, Actual: g.actualPoints, Projected: g.projectedPoints }));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No game log available for this player yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="Projected" fill="hsl(var(--muted-foreground) / 0.35)" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
