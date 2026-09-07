/** Shared by TeamAvatar and the Teams index banner cards, for a consistent placeholder look when a team has no photo. */
export function initials(name: string): string {
  const words = name.replace(/^The\s+/i, "").split(/\s+/).filter(Boolean);
  const chars = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return chars.join("") || "?";
}

/** Deterministic hue from the team id, so a team's placeholder color is stable across renders. */
export function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}
