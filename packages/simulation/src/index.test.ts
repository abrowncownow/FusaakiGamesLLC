import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createScenarioService,
  createWorld,
  isCommand,
  planFor,
  rawOutstanding,
} from "./index.js";
import type { Command, Scenario, World } from "./index.js";

const day = (world: World) =>
  applyCommand(world, { type: "advance", steps: 1 });
const willow = (world: World) => world.settlements[0]!;

function assertBudgets(world: World) {
  for (const resource of ["timber", "ore"] as const) {
    const total =
      (resource === "timber" ? world.forestTimber : world.mineOre) +
      world.player.inventory[resource] +
      world.settlements.reduce(
        (sum, group) =>
          sum +
          group.home[resource] +
          group.field[resource] +
          group.used[resource] +
          group.workshop.reserved[resource] +
          (group.convoy?.resource === resource ? group.convoy.amount : 0),
        0,
      );
    expect(total).toBe(resource === "timber" ? 2000 : 1000);
  }
  const initial = createWorld(world.scenario, world.seed);
  const initialFood =
    initial.player.inventory.food +
    initial.settlements.reduce((sum, group) => sum + group.home.food, 0);
  const remainingFood =
    world.player.inventory.food +
    world.settlements.reduce(
      (sum, group) => sum + group.home.food + (group.convoy?.provisions ?? 0),
      0,
    );
  expect(remainingFood + world.ledger.foodConsumed).toBe(
    initialFood + world.ledger.foodGathered,
  );
  expect(
    world.settlements.reduce((sum, group) => sum + group.home.tools, 0),
  ).toBe(world.ledger.toolsCrafted);
  for (const group of world.settlements) {
    expect(
      Object.values(group.plan.workers).reduce((sum, value) => sum + value, 0),
    ).toBe(group.workers);
    for (const amount of [
      ...Object.values(group.home),
      ...Object.values(group.field),
      ...Object.values(group.used),
      ...Object.values(group.workshop.reserved),
      ...Object.values(group.plan.workers),
      group.convoy?.amount ?? 0,
      group.convoy?.provisions ?? 0,
    ]) {
      expect(amount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(amount)).toBe(true);
    }
    if (group.convoy)
      expect(group.convoy.escorts + 1).toBeLessThan(group.workers);
  }
}

function firstConvoy(scenario: Scenario = "balanced", seed = 7) {
  const world = applyCommand(createWorld(scenario, seed), {
    type: "next-convoy",
  });
  expect(willow(world).convoy).not.toBeNull();
  return world;
}

function raid(world: World) {
  return applyCommand(world, {
    type: "intercept",
    settlementId: "willow",
    convoyId: willow(world).convoy!.id,
  });
}

function nextWillowConvoy(world: World) {
  const oldId = willow(world).convoy?.id;
  for (let i = 0; i < 60; i++) {
    world = day(world);
    if (willow(world).convoy && willow(world).convoy!.id !== oldId)
      return world;
  }
  throw new Error("No replacement convoy departed within 60 days.");
}

function completionDay(start: World) {
  let world = start;
  while (!willow(world).workshop.complete && world.tick < 150)
    world = day(world);
  expect(willow(world).workshop.complete).toBe(true);
  return world.tick;
}

describe("autonomous settlement economy", () => {
  it.each<Scenario>(["balanced", "food-shortage", "small-crew"])(
    "sustains %s NPCs and conserves every stock through construction and toolmaking",
    (scenario) => {
      let world = createWorld(scenario);
      for (let tick = 0; tick < 180; tick++) {
        world = day(world);
        assertBudgets(world);
      }
      expect(
        world.settlements.every(
          (group) => group.workshop.complete && group.home.tools === 2,
        ),
      ).toBe(true);
      expect(world.settlements.map((group) => group.used)).toEqual([
        { timber: 28, ore: 10 },
        { timber: 28, ore: 10 },
      ]);
      expect(world.events.length).toBeLessThanOrEqual(120);
      expect(world.ledger.foodGathered).toBeGreaterThan(100);
    },
  );

  it("prioritizes food shortages and adjusts schedules to crew size", () => {
    const normal = createWorld();
    const hungry = createWorld("food-shortage");
    expect(willow(normal).plan.workers.foraging).toBe(0);
    expect(willow(hungry).plan.workers.foraging).toBe(3);
    expect(willow(hungry).plan.workers.production).toBe(1);
    expect(completionDay(hungry)).toBeGreaterThan(completionDay(normal));
    expect(completionDay(createWorld("small-crew"))).toBeGreaterThan(
      completionDay(normal),
    );
  });

  it("lets players outperform NPCs, pays for their meals, and keeps their completed work", () => {
    const original = createWorld();
    const joined = applyCommand(original, {
      type: "join",
      settlementId: "willow",
      profile: "novice",
    });
    const helped = day(joined);
    expect(willow(helped).field.timber).toBe(4);
    expect(helped.settlements[1]!.field.timber).toBe(2);
    expect(helped.ledger.foodConsumed).toBe(9);
    assertBudgets(helped);
    const left = applyCommand(helped, { type: "leave" });
    expect(willow(left).field).toEqual(willow(helped).field);
    const continued = day(left);
    expect(willow(continued).field.ore).toBeGreaterThan(willow(left).field.ore);
    expect(continued.player.assignment).toBeNull();
    const skilled = day(
      applyCommand(original, {
        type: "join",
        settlementId: "willow",
        profile: "skilled",
      }),
    );
    expect(willow(skilled).field.timber).toBe(6);
    expect(completionDay(continued)).toBeLessThanOrEqual(
      completionDay(original),
    );
    expect(original).toEqual(createWorld());
  });

  it("ends a player's assignment when the requisition is filled and never oversupplies it", () => {
    let world = applyCommand(createWorld(), {
      type: "join",
      settlementId: "willow",
      profile: "skilled",
    });
    for (let i = 0; i < 12 && world.player.assignment; i++) {
      world = day(world);
      assertBudgets(world);
    }
    expect(world.player.assignment).toBeNull();
    expect(rawOutstanding(willow(world), "timber")).toBe(0);
    expect(
      willow(world).field.timber +
        willow(world).home.timber +
        (willow(world).convoy?.resource === "timber"
          ? willow(world).convoy!.amount
          : 0),
    ).toBe(24);
  });

  it("uses common rules with priorities supplied as data", () => {
    const world = firstConvoy();
    const attacked = raid(world);
    const group = willow(attacked);
    const secure = planFor(attacked, group).candidates.find(
      (candidate) => candidate.label === "Ship timber · 0 escorts",
    )!;
    group.priorities.security = 0;
    const indifferent = planFor(attacked, group).candidates.find(
      (candidate) => candidate.label === secure.label,
    )!;
    expect(indifferent.score).toBeGreaterThan(secure.score);
  });

  it("does not create raw resources if a source is exhausted", () => {
    let world = createWorld();
    world.forestTimber = 1;
    world.mineOre = 0;
    world = applyCommand(world, { type: "advance", steps: 30 });
    expect(world.forestTimber).toBe(0);
    expect(world.mineOre).toBe(0);
    expect(
      world.settlements.reduce((sum, group) => sum + group.field.timber, 0),
    ).toBe(1);
    expect(
      world.settlements.every(
        (group) => !group.workshop.complete && group.home.food >= 0,
      ),
    ).toBe(true);
  });
});

describe("cargo losses and constrained responses", () => {
  it("transfers actual cargo, targets the responsible player, and delays the workshop", () => {
    const before = firstConvoy();
    const attacked = raid(before);
    const stolen = attacked.player.inventory.timber;
    expect(stolen).toBe(9); // Seed 7 is a reproducible tester scenario.
    expect(willow(attacked).convoy!.amount).toBe(12 - stolen);
    expect(willow(attacked).losses.timber).toBe(stolen);
    expect(willow(attacked).threatFromPlayer).toBe(50);
    expect(attacked.settlements[1]!.threatFromPlayer).toBe(0);
    expect(attacked.player.inventory.food).toBe(5);
    expect(rawOutstanding(willow(attacked), "timber")).toBe(
      rawOutstanding(willow(before), "timber") + stolen,
    );
    expect(completionDay(attacked)).toBeGreaterThan(completionDay(before));
    assertBudgets(attacked);
    expect(willow(before).convoy!.amount).toBe(12);
  });

  it("pays for guards with labor and provisions and repels an understrength attack", () => {
    const response = nextWillowConvoy(raid(firstConvoy()));
    const group = willow(response);
    expect(group.convoy!.escorts).toBe(2);
    expect(group.convoy!.provisions).toBe(6); // Nine packed, three eaten on departure day.
    expect(group.plan.workers.traveling).toBe(3);
    expect(group.plan.workers.production).toBe(0);
    const repelled = raid(response);
    expect(repelled.player.inventory.timber).toBe(
      response.player.inventory.timber,
    );
    expect(repelled.player.inventory.food).toBe(
      response.player.inventory.food - 1,
    );
    expect(willow(repelled).convoy!.amount).toBe(group.convoy!.amount);
    expect(repelled.events.at(-1)!.text).toContain("repelled");
    assertBudgets(repelled);
    const arrived = applyCommand(repelled, { type: "advance", steps: 3 });
    expect(willow(arrived).home.timber).toBeGreaterThan(group.home.timber);
    assertBudgets(arrived);
  });

  it("cannot invent escorts when a two-person settlement is attacked", () => {
    const response = nextWillowConvoy(raid(firstConvoy("small-crew")));
    expect(willow(response).threatFromPlayer).toBe(50);
    expect(willow(response).convoy!.escorts).toBe(0);
    expect(willow(response).plan.workers.traveling).toBe(1);
    assertBudgets(response);
  });

  it("sends smaller loads when repeated losses make a full unguarded shipment too risky", () => {
    const once = raid(firstConvoy("small-crew"));
    const twice = raid(nextWillowConvoy(once));
    const response = nextWillowConvoy(twice);
    expect(willow(response).threatFromPlayer).toBe(100);
    expect(willow(response).convoy!.escorts).toBe(0);
    expect(willow(response).convoy!.amount).toBe(4);
    expect(willow(response).lastAction).toContain("light load");
    assertBudgets(response);
  });

  it("rejects stale convoy IDs, repeated attacks, same-day attacks, occupied players and empty packs without mutation", () => {
    const before = firstConvoy();
    const convoyId = willow(before).convoy!.id;
    const command: Command = {
      type: "intercept",
      settlementId: "willow",
      convoyId,
    };
    const attacked = applyCommand(before, command);
    expect(() => applyCommand(attacked, command)).toThrow("already faced");
    expect(() =>
      applyCommand(attacked, {
        type: "intercept",
        settlementId: "bracken",
        convoyId: attacked.settlements[1]!.convoy!.id,
      }),
    ).toThrow("one convoy per day");
    expect(() => applyCommand(nextWillowConvoy(attacked), command)).toThrow(
      "no longer",
    );
    const assigned = applyCommand(before, {
      type: "join",
      settlementId: "willow",
      profile: "novice",
    });
    expect(() => applyCommand(assigned, command)).toThrow(
      "Leave your work crew",
    );
    expect(() =>
      applyCommand(assigned, {
        type: "join",
        settlementId: "bracken",
        profile: "novice",
      }),
    ).toThrow("current crew");
    const empty = structuredClone(before);
    empty.player.inventory.food = 0;
    expect(() => applyCommand(empty, command)).toThrow("no travel rations");
    expect(before).toEqual(firstConvoy());
  });

  it.each<Scenario>(["balanced", "food-shortage", "small-crew"])(
    "keeps %s stocks and labor valid under repeated raids across seeds",
    (scenario) => {
      for (const seed of [0, 1, 7, 0xffffffff]) {
        let world = createWorld(scenario, seed);
        for (let i = 0; i < 100; i++) {
          world = day(world);
          if (
            willow(world).convoy &&
            !willow(world).convoy!.intercepted &&
            world.player.inventory.food > 0
          )
            world = raid(world);
          assertBudgets(world);
        }
        expect(
          world.settlements.every(
            (group) => group.workshop.complete && group.home.tools === 2,
          ),
        ).toBe(true);
      }
    },
  );
});

describe("replay and command boundaries", () => {
  it("does not recycle convoy IDs on reset or let old commands attack a fresh run", () => {
    const before = firstConvoy();
    const command: Command = {
      type: "intercept",
      settlementId: "willow",
      convoyId: willow(before).convoy!.id,
    };
    const fresh = applyCommand(
      applyCommand(before, { type: "reset", seed: 7 }),
      { type: "next-convoy" },
    );
    expect(willow(fresh).convoy!.id).not.toBe(command.convoyId);
    expect(() => applyCommand(fresh, command)).toThrow("no longer");
    expect(willow(fresh).convoy!.amount).toBe(12);
    expect(fresh.player.inventory.food).toBe(6);
  });

  it("replays seed and commands identically, including batched time", () => {
    const run = () =>
      applyCommand(raid(firstConvoy("balanced", 0)), {
        type: "advance",
        steps: 20,
      });
    expect(run()).toEqual(run());
    expect(raid(firstConvoy("balanced", 1)).player.inventory.timber).not.toBe(
      raid(firstConvoy("balanced", 7)).player.inventory.timber,
    );
    const single = Array.from({ length: 30 }).reduce<World>(
      (world) => day(world),
      createWorld(),
    );
    expect(single).toEqual(
      applyCommand(createWorld(), { type: "advance", steps: 30 }),
    );
  });

  it("bounds the next-shipment clock and does not skip an available convoy", () => {
    const first = firstConvoy();
    expect(first.tick).toBe(9);
    expect(applyCommand(first, { type: "next-convoy" })).toEqual(first);
    const complete = applyCommand(
      applyCommand(createWorld(), { type: "advance", steps: 30 }),
      { type: "advance", steps: 30 },
    );
    expect(applyCommand(complete, { type: "next-convoy" }).tick).toBe(90);
  });

  it("rejects malformed, coerced or unbounded commands", () => {
    for (const value of [
      { type: "advance", steps: -1 },
      { type: "advance", steps: 31 },
      { type: "advance", steps: 1.5 },
      { type: "advance", steps: "3" },
      { type: "reset", money: 100 },
      { type: "reset", scenario: ["balanced"] },
      { type: "reset", seed: -1 },
      { type: "reset", seed: 0x100000000 },
      { type: "reset", seed: null },
      { type: "join", settlementId: ["willow"], profile: "novice" },
      { type: "intercept", settlementId: "willow", convoyId: "" },
      { type: "next-convoy", steps: 500 },
      null,
    ])
      expect(isCommand(value)).toBe(false);
    expect(isCommand({ type: "reset", scenario: "small-crew", seed: 0 })).toBe(
      true,
    );
  });

  it("deduplicates raid retries and protects stored worlds and receipts from callers", () => {
    const service = createScenarioService();
    const before = service.execute("next", { type: "next-convoy" });
    const command: Command = {
      type: "intercept",
      settlementId: "willow",
      convoyId: willow(before).convoy!.id,
    };
    const result = service.execute("raid", command);
    const expected = structuredClone(result);
    result.player.inventory.timber = 900;
    expect(service.execute("raid", command)).toEqual(expected);
    expect(service.snapshot()).toEqual(expected);
    expect(() =>
      service.execute("raid", { type: "advance", steps: 4 }),
    ).toThrow("different action");
    expect(() => service.execute("another-raid", command)).toThrow(
      "already faced",
    );
    expect(service.snapshot()).toEqual(expected);
    service.snapshot().settlements.length = 0;
    expect(service.snapshot().settlements).toHaveLength(2);
  });
});
