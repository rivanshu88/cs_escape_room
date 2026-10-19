import assert from "node:assert/strict";
import test from "node:test";
import { ESCAPE_CAMPAIGNS } from "../src/lib/escapeRoom/campaigns";
import { simulateStage } from "../src/lib/escapeRoom/simulation";

test("escape-room campaigns contain five stages each", () => {
  const campaigns = Object.values(ESCAPE_CAMPAIGNS);

  assert.equal(campaigns.length, 3);
  for (const campaign of campaigns) {
    assert.equal(campaign.stages.length, 5, `${campaign.language} stage count`);
  }
});

test("each stage fails before its documented repair and passes after it", () => {
  for (const campaign of Object.values(ESCAPE_CAMPAIGNS)) {
    for (const stage of campaign.stages) {
      assert.equal(
        simulateStage(stage, stage.starterCode).passed,
        false,
        `${stage.id} starter should fail`
      );

      const repairedCode = stage.starterCode.replace(
        stage.faultyLine,
        stage.repairLine
      );
      assert.notEqual(repairedCode, stage.starterCode, `${stage.id} fault line`);
      assert.equal(
        simulateStage(stage, repairedCode).passed,
        true,
        `${stage.id} repair should pass`
      );

      assert.equal(
        simulateStage(stage, `${stage.starterCode}\n${stage.repairLine}`).passed,
        false,
        `${stage.id} should fail while its faulty line remains`
      );
    }
  }
});

test("repairs followed by inline comments still pass", () => {
  const stage = ESCAPE_CAMPAIGNS.cpp.stages[0];
  const commentedRepair =
    "int total = 0;\n" +
    `${stage.repairLine} // Fixed: include the last reading\n` +
    "    total += values[i];\n}";

  assert.equal(simulateStage(stage, commentedRepair).passed, true);
});

test("an inline comment cannot hide the original faulty line", () => {
  const stage = ESCAPE_CAMPAIGNS.cpp.stages[0];
  const faultyCode = `${stage.faultyLine} // TODO: fix this`;

  assert.equal(simulateStage(stage, faultyCode).passed, false);
});
