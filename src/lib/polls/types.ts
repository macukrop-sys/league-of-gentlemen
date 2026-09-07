export interface PollOption {
  id: string;
  label: string;
}

/** A poll is derived, not authored — see `matchupPolls.ts`. `id` is deterministic from the week + matchup so it never needs to be created or stored ahead of time. */
export interface Poll {
  id: string;
  week: number;
  question: string;
  options: PollOption[];
}

export interface PollResults {
  pollId: string;
  /** Vote count per option id — always present for every option, zero-filled when unvoted. */
  counts: Record<string, number>;
  total: number;
  /** The option this voter already chose, or null if they haven't voted (or aren't known yet). */
  myChoice: string | null;
}
