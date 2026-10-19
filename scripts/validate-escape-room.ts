import { ESCAPE_CAMPAIGNS } from "../src/lib/escapeRoom/campaigns";
import { simulateStage } from "../src/lib/escapeRoom/simulation";

const errors: string[] = [];
const stageIds = new Set<string>();

for (const campaign of Object.values(ESCAPE_CAMPAIGNS)) {
  if (campaign.stages.length !== 5) {
    errors.push(`${campaign.label}: expected exactly 5 stages, found ${campaign.stages.length}.`);
  }

  for (const stage of campaign.stages) {
    if (stageIds.has(stage.id)) errors.push(`${stage.id}: duplicate stage id.`);
    stageIds.add(stage.id);

    if (!stage.briefing || !stage.objective || !stage.evidence.length || !stage.nextBriefing) {
      errors.push(`${stage.id}: missing story, objective, evidence, or transition.`);
    }

    const lines = stage.starterCode.split(/\r?\n/);
    const faultyLineMatches = lines.filter((line) => line.trim() === stage.faultyLine.trim());
    if (faultyLineMatches.length !== 1) {
      errors.push(`${stage.id}: faulty source line must appear exactly once in its starter.`);
      continue;
    }

    if (simulateStage(stage, stage.starterCode).passed) {
      errors.push(`${stage.id}: the unmodified starter incorrectly passes its repair check.`);
    }

    const repairedCode = lines
      .map((line) => (line.trim() === stage.faultyLine.trim() ? stage.repairLine : line))
      .join("\n");
    if (!simulateStage(stage, repairedCode).passed) {
      errors.push(`${stage.id}: replacing its faulty line with the documented repair does not pass.`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${Object.keys(ESCAPE_CAMPAIGNS).length} campaigns and ${stageIds.size} repairable stages.`);
}
