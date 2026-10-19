export type EscapeLanguage = "cpp" | "python" | "java";

export interface EscapeStage {
  id: string;
  title: string;
  briefing: string;
  failure: string;
  objective: string;
  starterCode: string;
  faultyLine: string;
  repairLine: string;
  evidence: string[];
  hints: string[];
  successMessage: string;
  nextBriefing: string;
}

export interface EscapeCampaign {
  language: EscapeLanguage;
  label: string;
  description: string;
  campaignTitle: string;
  campaignSubtitle: string;
  editorLanguage: string;
  stages: EscapeStage[];
}

export interface EscapeProgress {
  completedStageIds: string[];
}

export type EscapeProgressByLanguage = Partial<
  Record<EscapeLanguage, EscapeProgress>
>;

export interface SimulationResult {
  passed: boolean;
  trace: string[];
}
