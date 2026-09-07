/**
 * Team -> photo mapping for the team profile pages. Keyed by the team's
 * stable `id` (e.g. "espn-4" once ESPN is live, or "team-3" in mock mode —
 * check a page's URL or the standings API response to find a team's id).
 *
 * To add a photo: drop the image file in `public/teams/`, then add one
 * line here pointing at it. No photo configured -> the team page falls
 * back to a generated initials avatar (see `TeamAvatar.tsx`), so this is
 * safe to leave partially filled in.
 */
export const TEAM_PHOTOS: Record<string, string> = {
  // "espn-4": "/teams/espn-4.jpg",
};

export function getTeamPhotoUrl(teamId: string): string | null {
  return TEAM_PHOTOS[teamId] ?? null;
}
