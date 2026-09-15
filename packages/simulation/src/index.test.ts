import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createScenarioService,
  createWorld,
  isCommand,
  TIMBER_REQUIRED,
} from "./index.js";
import type { Command, World } from "./index.js";

function timberTotal(world: World) {
  return (
    world.forestTimber +
    world.settlements.reduce(
      (sum, group) =>
        sum +
        group.timberAtForest +
        group.cargo +
        group.timberAtHome +
        group.timberUsed,
      0,
    )
  );
}

describe("deterministic timber scenario", () => {
  it("completes NPC work without a player and conserves timber through every stage", () => {
    let world = createWorld();
    for (let tick = 0; tick < 40; tick++) {
      world = applyCommand(world, { type: "advance", steps: 1 });
      expect(timberTotal(world)).toBe(96);
      for (const group of world.settlements) {
        expect(group.cargo).toBeGreaterThanOrEqual(0);
        expect(group.timberAtHome).toBeGreaterThanOrEqual(0);
      }
    }
    expect(
      world.settlements.every(
        (group) =>
          group.stage === "complete" && group.timberUsed === TIMBER_REQUIRED,
      ),
    ).toBe(true);
  });

  it("lets players outperform an NPC and preserves the work when they leave", () => {
    const original = createWorld();
    const joined = applyCommand(original, {
      type: "join",
      settlementId: "willow",
      profile: "novice",
    });
    const helped = applyCommand(joined, { type: "advance", steps: 2 });
    expect(helped.settlements[0]?.timberAtForest).toBe(8);
    expect(helped.settlements[1]?.timberAtForest).toBe(4);
    const left = applyCommand(helped, { type: "leave" });
    const continued = applyCommand(left, { type: "advance", steps: 1 });
    expect(continued.settlements[0]?.timberAtForest).toBe(10);
    const skilled = applyCommand(
      applyCommand(original, {
        type: "join",
        settlementId: "willow",
        profile: "skilled",
      }),
      { type: "advance", steps: 2 },
    );
    expect(skilled.settlements[0]?.timberAtForest).toBe(12);
    expect(original).toEqual(createWorld());
  });

  it("replays the same commands identically, including batched time", () => {
    const commands: Command[] = [
      { type: "join", settlementId: "bracken", profile: "novice" },
      { type: "advance", steps: 4 },
      { type: "leave" },
      { type: "advance", steps: 15 },
    ];
    const run = () => commands.reduce(applyCommand, createWorld());
    expect(run()).toEqual(run());
    const single = Array.from({ length: 20 }).reduce<World>(
      (world) => applyCommand(world, { type: "advance", steps: 1 }),
      createWorld(),
    );
    expect(single).toEqual(
      applyCommand(createWorld(), { type: "advance", steps: 20 }),
    );
  });

  it("rejects malformed or unbounded commands", () => {
    for (const value of [
      { type: "advance", steps: -1 },
      { type: "advance", steps: 31 },
      { type: "advance", steps: 1.5 },
      { type: "reset", money: 100 },
      { type: "join", settlementId: "unknown", profile: "skilled" },
      null,
    ])
      expect(isCommand(value)).toBe(false);
  });

  it("deduplicates retries, rejects reused IDs, and protects stored state from callers", () => {
    const service = createScenarioService();
    const command: Command = { type: "advance", steps: 3 };
    const first = service.execute("receipt-1", command);
    first.tick = 900;
    expect(service.execute("receipt-1", command).tick).toBe(3);
    expect(service.snapshot().tick).toBe(3);
    expect(() =>
      service.execute("receipt-1", { type: "advance", steps: 4 }),
    ).toThrow("different action");
    service.snapshot().settlements.length = 0;
    expect(service.snapshot().settlements).toHaveLength(2);
  });
});
