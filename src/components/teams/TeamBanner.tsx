import { getTeamPhotoUrl } from "@/lib/teamPhotos";
import { initials, hueFromSeed } from "@/lib/teamVisuals";
import { cn } from "@/lib/utils";

/** A large, actually-visible photo treatment — for the Teams grid and anywhere else a thumbnail-sized avatar undersells the photo. */
export function TeamBanner({ teamId, name, className }: { teamId: string; name: string; className?: string }) {
  const photoUrl = getTeamPhotoUrl(teamId, name);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied photos live in /public, not the Next.js image pipeline
      <img src={photoUrl} alt={name} style={{ objectPosition: "50% 12%" }} className={cn("w-full object-cover", className)} />
    );
  }

  const hue = hueFromSeed(teamId);
  return (
    <div
      style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 32%), hsl(${hue} 55% 16%))` }}
      className={cn("flex w-full items-center justify-center font-display text-3xl font-semibold text-primary-foreground", className)}
    >
      {initials(name)}
    </div>
  );
}
