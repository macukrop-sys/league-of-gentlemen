import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import type { DataSourceName } from "@/lib/data/provider";

export function Header({ leagueName, week, dataSource }: { leagueName: string; week: number; dataSource: DataSourceName }) {
  const isLive = dataSource !== "Demo";
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-3 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Crown className="h-5 w-5 text-primary" />
        <span className="font-display text-sm font-semibold">{leagueName}</span>
      </div>
      <div className="hidden md:block">
        <p className="text-sm text-muted-foreground">
          Welcome back, gentlemen. It is currently <span className="font-tabular font-medium text-foreground">Week {week}</span>.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 font-tabular">
          <span className="relative flex h-1.5 w-1.5">
            <span className={isLive ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" : ""} />
            <span className={cnDot(isLive)} />
          </span>
          {isLive ? `Live ${dataSource} data` : "Demo data"}
        </Badge>
        <Badge className="font-tabular">Week {week}</Badge>
      </div>
    </header>
  );
}

function cnDot(isLive: boolean) {
  return `relative inline-flex h-1.5 w-1.5 rounded-full ${isLive ? "bg-success" : "bg-muted-foreground"}`;
}
