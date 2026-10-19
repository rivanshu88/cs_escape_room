import { create } from "zustand";

interface LabState {
  codeByMission: Record<string, string>;
  setCode: (missionId: string, code: string) => void;
}

export const useLabStore = create<LabState>((set) => ({
  codeByMission: {},
  setCode: (missionId, code) =>
    set((state) => ({
      codeByMission: { ...state.codeByMission, [missionId]: code },
    })),
}));
