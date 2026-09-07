import { getTeamPhotoUrl } from "@/lib/teamPhotos";

function initials(name: string): string {
  const words = name.replace(/^The\s+/i, "").split(/\s+/).filter(Boolean);
  const chars = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return chars.join("") || "?";
}

/** Deterministic hue from the team id, so a team's placeholder color is stable across renders. */
function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export function TeamAvatar({ teamId, name, size = 44 }: { teamId: string; name: string; size?: number }) {
  const photoUrl = getTeamPhotoUrl(teamId);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied photos live in /public, not the Next.js image pipeline
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full border border-border object-cover"
      />
    );
  }

  const hue = hueFromSeed(teamId);
  return (
    <div
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 55% 30%), hsl(${hue} 55% 18%))`, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full border border-border font-display font-semibold text-primary-foreground"
    >
      {initials(name)}
    </div>
  );
}
