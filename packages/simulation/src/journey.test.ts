import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createScenarioService,
  createWorld,
  getJourneyActions,
  isCommand,
  WORKSHOP_COST,
  type JourneyActionId,
  type World,
} from "./index.js";

function start() {
  return applyCommand(createWorld(), { type: "start-journey", runId: 0 });
}

function command(world: World, action: JourneyActionId) {
  return {
    type: "journey-action" as const,
    runId: world.runId,
    revision: world.journey!.revision,
    action,
  };
}

function act(world: World, action: JourneyActionId) {
  const next = applyCommand(world, command(world, action));
  expect(next.tick).toBe(world.tick + 1);
  expect(next.journey!.revision).toBe(world.journey!.revision + 1);
  expect(next.journey!.reports.at(-1)).toMatchObject({
    fromDay: world.tick,
    toDay: next.tick,
    revision: next.journey!.revision,
  });
  accounts(next);
  return next;
}

function accounts(world: World) {
  for (const resource of ["timber", "ore"] as const) {
    const total = world.settlements.reduce(
      (sum, group) =>
        sum +
        group.home[resource] +
        group.field[resource] +
        group.used[resource] +
        group.workshop.reserved[resource] +
        (group.convoy?.resource === resource ? group.convoy.amount : 0),
      world.player.inventory[resource] +
        (resource === "timber" ? world.forestTimber : world.mineOre),
    );
    expect(total).toBe(resource === "timber" ? 2000 : 1000);
  }
  const food = world.settlements.reduce(
    (sum, group) => sum + group.home.food + (group.convoy?.provisions ?? 0),
    world.player.inventory.food,
  );
  expect(food + world.ledger.foodConsumed).toBe(54 + world.ledger.foodGathered);
  const tools = world.settlements.reduce(
    (sum, group) => sum + group.home.tools,
    world.player.inventory.tools,
  );
  expect(tools).toBe(world.ledger.toolsCrafted);
  for (const group of world.settlements) {
    for (const value of [
      ...Object.values(group.home),
      ...Object.values(group.field),
      ...Object.values(group.used),
      ...Object.values(group.workshop.reserved),
      ...Object.values(world.player.inventory),
      group.convoy?.amount ?? 0,
      group.convoy?.provisions ?? 0,
    ]) {
      expect(Number.isSafeInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
    expect(
      Object.values(group.plan.workers).reduce((sum, value) => sum + value, 0),
    ).toBe(group.workers);
  }
}

describe("exploring the living valley", () => {
  it("starts at the wood and gathers real timber while NPCs work", () => {
    const opening = start();
    expect(opening.journey).toMatchObject({
      location: "wood",
      visited: ["wood"],
      revision: 0,
      discovery: false,
    });
    expect(opening.charter).toBeNull();
    const next = act(opening, "gather-timber");
    expect(next.player.inventory.timber).toBe(4);
    expect(next.journey!.gathered.timber).toBe(4);
    expect(next.settlements.some((group) => group.field.timber > 0)).toBe(true);
    expect(opening.tick).toBe(0);
    expect(opening.player.inventory.timber).toBe(0);
  });

  it("requires local, connected travel and advances the real convoys", () => {
    let world = start();
    expect(() => applyCommand(world, command(world, "travel-ruins"))).toThrow(
      "not available here",
    );
    expect(() => applyCommand(world, command(world, "gather-ore"))).toThrow(
      "not available here",
    );
    expect(() => applyCommand(world, command(world, "deliver-willow"))).toThrow(
      "not available here",
    );
    for (
      let turn = 0;
      turn < 25 && !world.settlements.some((group) => group.convoy);
      turn++
    )
      world = act(world, "rest");
    const prior = world.settlements.find((group) => group.convoy)!;
    expect(prior.convoy).not.toBeNull();
    const remaining = prior.convoy!.travelRemaining;
    const next = act(world, "travel-mine");
    expect(next.journey!.location).toBe("mine");
    expect(
      next.settlements.find((group) => group.id === prior.id)!.convoy
        ?.travelRemaining ?? 0,
    ).toBe(remaining - 1);
    expect(next.journey!.visited).toEqual(["wood", "mine"]);
  });

  it("carries gathered supplies to a village and transfers them once", () => {
    let world = act(start(), "gather-timber");
    world = act(world, "travel-willow");
    const before = world;
    world = act(world, "deliver-willow");
    expect(world.player.inventory.timber).toBe(0);
    expect(world.journey!.delivered.willow).toBe(4);
    expect(world.settlements[0]!.home.timber).toBe(
      before.settlements[0]!.home.timber + 4,
    );
    expect(
      getJourneyActions(world).some((action) => action.id === "deliver-willow"),
    ).toBe(false);
  });

  it("caps handovers to the existing order and an eight-unit carry load", () => {
    let world = act(start(), "travel-willow");
    world.player.inventory.timber = 20;
    world.forestTimber -= 20;
    world = act(world, "deliver-willow");
    expect(world.journey!.delivered.willow).toBe(8);
    expect(world.player.inventory.timber).toBe(12);
    const group = world.settlements[0]!;
    const needed = 24 - group.home.timber - group.field.timber;
    group.home.timber += needed;
    world.forestTimber -= needed;
    expect(
      getJourneyActions(world).some((action) => action.id === "deliver-willow"),
    ).toBe(false);
    accounts(world);
  });

  it("mines finite ore and never offers exhausted gathering", () => {
    let world = act(start(), "travel-mine");
    world = act(world, "gather-ore");
    expect(world.player.inventory.ore).toBe(2);
    expect(world.journey!.gathered.ore).toBe(2);
    world.player.inventory.ore += world.mineOre - 1;
    world.mineOre = 1;
    world = act(world, "gather-ore");
    expect(world.mineOre).toBe(0);
    expect(world.journey!.gathered.ore).toBe(3);
    expect(
      getJourneyActions(world).some((action) => action.id === "gather-ore"),
    ).toBe(false);
  });

  it("surveying the lookout once opens a real shortcut without creating goods", () => {
    let world = act(act(start(), "travel-mine"), "travel-ruins");
    expect(
      getJourneyActions(world).some((action) => action.id === "travel-willow"),
    ).toBe(false);
    const pack = structuredClone(world.player.inventory);
    world = act(world, "discover-ruins");
    expect(world.journey!.discovery).toBe(true);
    expect(world.player.inventory).toEqual(pack);
    expect(
      getJourneyActions(world).some((action) => action.id === "discover-ruins"),
    ).toBe(false);
    world = act(world, "travel-willow");
    expect(
      getJourneyActions(world).some((action) => action.id === "travel-ruins"),
    ).toBe(true);
    world = act(world, "travel-ruins");
    expect(
      world.journey!.visited.filter((place) => place === "ruins"),
    ).toHaveLength(1);
    expect(() => applyCommand(world, command(world, "discover-ruins"))).toThrow(
      "not available here",
    );
  });

  it("requires funded construction and combines player work with NPC work", () => {
    let world = act(start(), "travel-willow");
    expect(() => applyCommand(world, command(world, "build-willow"))).toThrow(
      "not available here",
    );
    const group = world.settlements[0]!;
    for (const resource of ["timber", "ore"] as const) {
      group.home[resource] += WORKSHOP_COST[resource];
      world[resource === "timber" ? "forestTimber" : "mineOre"] -=
        WORKSHOP_COST[resource];
    }
    const waited = act(world, "rest");
    const built = act(world, "build-willow");
    expect(built.settlements[0]!.workshop.work).toBe(
      waited.settlements[0]!.workshop.work + 1,
    );
    expect(built.settlements[0]!.workshop.reserved).toEqual(WORKSHOP_COST);
    world = act(built, "build-willow");
    expect(world.settlements[0]!.workshop.complete).toBe(true);
    expect(world.settlements[0]!.workshop.reserved).toEqual({
      timber: 0,
      ore: 0,
    });
    expect(
      getJourneyActions(world).some((action) => action.id === "build-willow"),
    ).toBe(false);
  });

  it("rejects stale, remote and raw Lab actions atomically; receipts retry safely", () => {
    const service = createScenarioService();
    const world = service.execute("start", { type: "start-journey", runId: 0 });
    const action = command(world, "gather-timber");
    const next = service.execute("gather", action);
    expect(service.execute("gather", action)).toEqual(next);
    expect(() => service.execute("stale", action)).toThrow("out of date");
    expect(() =>
      service.execute("remote", command(next, "deliver-bracken")),
    ).toThrow("not available here");
    expect(() =>
      service.execute("lab", { type: "advance", steps: 30 }),
    ).toThrow("exploration journey");
    expect(service.snapshot()).toEqual(next);
    const reset = service.execute("restart", {
      type: "start-journey",
      runId: next.runId,
    });
    expect(reset.runId).toBe(next.runId + 1);
    expect(() => service.execute("old-run", command(next, "rest"))).toThrow(
      "out of date",
    );
    expect(() =>
      service.execute("old-start", {
        type: "start-journey",
        runId: next.runId,
      }),
    ).toThrow("world has changed");
    expect(service.snapshot()).toEqual(reset);
  });

  it("validates command shapes and preserves the other experiment modes", () => {
    expect(isCommand({ type: "start-journey", runId: 0 })).toBe(true);
    expect(isCommand({ type: "start-journey", runId: -1 })).toBe(false);
    const valid = command(start(), "rest");
    expect(isCommand(valid)).toBe(true);
    expect(isCommand({ ...valid, action: "teleport" })).toBe(false);
    expect(isCommand({ ...valid, revision: 0.5 })).toBe(false);
    expect(isCommand({ ...valid, amount: 999 })).toBe(false);
    expect(getJourneyActions(createWorld())).toEqual([]);
    const world = start();
    expect(applyCommand(world, { type: "reset" }).journey).toBeNull();
    expect(
      applyCommand(world, {
        type: "start-charter",
        runId: world.runId,
        patron: "willow",
      }).journey,
    ).toBeNull();
  });

  it("allows open-ended exploration beyond inspection day with deterministic replay", () => {
    const replay = () => {
      let world = start();
      const route: JourneyActionId[] = [
        "gather-timber",
        "travel-willow",
        "deliver-willow",
        "travel-wood",
        "travel-mine",
        "gather-ore",
        "travel-ruins",
        "discover-ruins",
        "travel-willow",
        "deliver-willow",
      ];
      for (const action of route) world = act(world, action);
      for (let day = 0; day < 40; day++) world = act(world, "rest");
      return world;
    };
    const first = replay();
    expect(first.tick).toBe(50);
    expect(getJourneyActions(first).length).toBeGreaterThan(0);
    expect(replay()).toEqual(first);
  });
});
