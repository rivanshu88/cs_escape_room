import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ESCAPE_CAMPAIGNS } from "./campaigns";
import type {
  EscapeLanguage,
  EscapeProgress,
  EscapeProgressByLanguage,
} from "./types";

interface EscapeProgressState {
  progress: EscapeProgressByLanguage;
  completeNextStage: (language: EscapeLanguage, stageId: string) => void;
  restartCampaign: (language: EscapeLanguage) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function restoreProgress(value: unknown): EscapeProgressByLanguage {
  if (!isRecord(value)) return {};
  const restored: EscapeProgressByLanguage = {};

  for (const language of Object.keys(ESCAPE_CAMPAIGNS) as EscapeLanguage[]) {
    const item = value[language];
    if (!isRecord(item) || !Array.isArray(item.completedStageIds)) continue;
    const knownStages = ESCAPE_CAMPAIGNS[language].stages;
    const completed = new Set(
      item.completedStageIds.filter(
        (id): id is string =>
          typeof id === "string" && knownStages.some((stage) => stage.id === id)
      )
    );
    const completedStageIds: string[] = [];
    for (const stage of knownStages) {
      if (!completed.has(stage.id)) break;
      completedStageIds.push(stage.id);
    }
    restored[language] = { completedStageIds };
  }
  return restored;
}

function completeStage(
  progress: EscapeProgressByLanguage,
  language: EscapeLanguage,
  stageId: string
): EscapeProgress {
  const campaign = ESCAPE_CAMPAIGNS[language];
  const completedStageIds = progress[language]?.completedStageIds ?? [];
  if (campaign.stages[completedStageIds.length]?.id !== stageId) {
    return { completedStageIds };
  }
  return { completedStageIds: [...completedStageIds, stageId] };
}

export const useEscapeProgressStore = create<EscapeProgressState>()(
  persist(
    (set) => ({
      progress: {},
      completeNextStage: (language, stageId) =>
        set((state) => {
          const next = completeStage(state.progress, language, stageId);
          if (next.completedStageIds.length === (state.progress[language]?.completedStageIds.length ?? 0)) {
            return state;
          }
          return {
            progress: { ...state.progress, [language]: next },
          };
        }),
      restartCampaign: (language) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [language]: { completedStageIds: [] },
          },
        })),
    }),
    {
      name: "cs-escape-room-progress-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ progress: state.progress }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState.progress : undefined;
        return { ...currentState, progress: restoreProgress(persisted) };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn("Escape-room progress could not be restored from local storage.");
      },
    }
  )
);
