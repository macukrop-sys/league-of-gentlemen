/**
 * Team -> photo (and first-round-pick) data for the team profile pages.
 *
 * Matched by team NAME rather than ESPN's internal roster id: this session
 * couldn't reach ESPN's API directly (sandbox network policy), so there
 * was no way to confirm the real `espn-<rosterId>` ids to key off of.
 * Matching on name sidesteps that — as soon as the real league loads,
 * `team.name` is literally e.g. "The Virus" or "Somali Pirates", which is
 * exactly what's keyed here. If ESPN's actual name differs even slightly
 * (extra emoji, different capitalization/spacing) from what's below, that
 * one team just won't match — fix the key here rather than the lookup
 * logic, or switch that entry to `BY_ID` with the real `espn-<n>` id once
 * you have it (Advanced Stats / Matchups pages show it in the page data).
 */
/**
 * Lowercases, strips non-alphanumerics, and collapses runs of the same
 * character to one — so "SEMiiiiiiiS Baby" and "Semis Baby" both normalize
 * to "semisbaby". Fantasy team names lean heavily on that kind of
 * stylized letter-repeat for emphasis, so matching on it is worth the
 * (checked below) small risk of two genuinely different names colliding.
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(.)\1+/g, "$1");
}

interface TeamPhotoEntry {
  file: string;
  firstRoundPick?: { player: string; position: string; nflTeam: string };
}

const BY_NAME: Record<string, TeamPhotoEntry> = {
  [normalize("Stamina Dawgs")]: { file: "stamina-dawgs.jpg", firstRoundPick: { player: "De'Von Achane", position: "RB", nflTeam: "Miami Dolphins" } },
  [normalize("The Virus")]: { file: "the-virus.jpg", firstRoundPick: { player: "Amon-Ra St. Brown", position: "WR", nflTeam: "Detroit Lions" } },
  [normalize("The Revenant Boogeymen")]: { file: "revenant-boogeymen.jpg", firstRoundPick: { player: "Puka Nacua", position: "WR", nflTeam: "Los Angeles Rams" } },
  [normalize("Andorra Aliens")]: { file: "andorra-aliens.jpg", firstRoundPick: { player: "Jahmyr Gibbs", position: "RB", nflTeam: "Detroit Lions" } },
  [normalize("Semis Baby")]: { file: "semis-baby.jpg", firstRoundPick: { player: "Bijan Robinson", position: "RB", nflTeam: "Atlanta Falcons" } },
  [normalize("Swag Like Mushu")]: { file: "swag-like-mushu.jpg", firstRoundPick: { player: "Ja'Marr Chase", position: "WR", nflTeam: "Cincinnati Bengals" } },
  [normalize("Somali Pirates")]: { file: "somali-pirates.jpg", firstRoundPick: { player: "CeeDee Lamb", position: "WR", nflTeam: "Dallas Cowboys" } },
  [normalize("Corn")]: { file: "corn.jpg", firstRoundPick: { player: "Jaxon Smith-Njigba", position: "WR", nflTeam: "Seattle Seahawks" } },
  [normalize("The Cap'n")]: { file: "the-capn.jpg", firstRoundPick: { player: "Justin Jefferson", position: "WR", nflTeam: "Minnesota Vikings" } },
  [normalize("Money Ball")]: { file: "money-ball.jpg", firstRoundPick: { player: "Christian McCaffrey", position: "RB", nflTeam: "San Francisco 49ers" } },
};

/** Fallback/override by stable team id, for when a name doesn't match cleanly. Empty until needed. */
const BY_ID: Record<string, TeamPhotoEntry> = {
  // "espn-4": { file: "stamina-dawgs.jpg" },
};

function lookup(teamId: string, name: string): TeamPhotoEntry | null {
  return BY_ID[teamId] ?? BY_NAME[normalize(name)] ?? null;
}

export function getTeamPhotoUrl(teamId: string, name: string): string | null {
  const entry = lookup(teamId, name);
  return entry ? `/teams/${entry.file}` : null;
}

export function getTeamFirstRoundPick(teamId: string, name: string): TeamPhotoEntry["firstRoundPick"] | null {
  return lookup(teamId, name)?.firstRoundPick ?? null;
}
