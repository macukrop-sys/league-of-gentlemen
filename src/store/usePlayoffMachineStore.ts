import { create } from "zustand";

interface PlayoffMachineState {
  /** matchupKey -> chosen winning teamId. Unset keys resolve to the chalk pick. */
  overrides: Record<string, string>;
  setWinner: (key: string, winnerTeamId: string) => void;
  setAll: (overrides: Record<string, string>) => void;
  reset: () => void;
}

export const usePlayoffMachineStore = create<PlayoffMachineState>((set) => ({
  overrides: {},
  setWinner: (key, winnerTeamId) => set((s) => ({ overrides: { ...s.overrides, [key]: winnerTeamId } })),
  setAll: (overrides) => set({ overrides }),
  reset: () => set({ overrides: {} }),
}));
