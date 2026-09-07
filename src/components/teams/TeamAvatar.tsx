import { getTeamPhotoUrl } from "@/lib/teamPhotos";
import { initials, hueFromSeed } from "@/lib/teamVisuals";

export function TeamAvatar({ teamId, name, size = 44 }: { teamId: string; name: string; size?: number }) {
  const photoUrl = getTeamPhotoUrl(teamId, name);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied photos live in /public, not the Next.js image pipeline
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, objectPosition: "50% 15%" }}
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
