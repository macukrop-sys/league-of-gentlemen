import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecapSection } from "@/lib/recap";
import { Flame, Swords, TrendingUp, TrendingDown, Siren, Sofa, Star } from "lucide-react";

const ICONS: Record<RecapSection["kind"], typeof Flame> = {
  blowout: Flame,
  nailbiter: Swords,
  topScore: TrendingUp,
  lowScore: TrendingDown,
  upset: Siren,
  benchRegret: Sofa,
  playerOfWeek: Star,
};

const ACCENTS: Record<RecapSection["kind"], string> = {
  blowout: "text-destructive",
  nailbiter: "text-primary",
  topScore: "text-success",
  lowScore: "text-destructive",
  upset: "text-primary",
  benchRegret: "text-muted-foreground",
  playerOfWeek: "text-success",
};

export function RecapCard({ section }: { section: RecapSection }) {
  const Icon = ICONS[section.kind];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <Icon className={`h-5 w-5 shrink-0 ${ACCENTS[section.kind]}`} />
        <CardTitle className="text-foreground">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-foreground">{section.body}</p>
        {section.playerId ? (
          <Link href={`/players/${section.playerId}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
            View player &rarr;
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
