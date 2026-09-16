import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createScenarioService,
  createWorld,
  getCharterChoices,
  isCommand,
  rawOutstanding,
} from "./index.js";
import type { Command, SettlementId, World } from "./index.js";

type ChoiceId = Extract<Command, { type: "charter-choice" }>["choice"];

function start(patron: SettlementId = "willow") {
  const world = createWorld();
  return applyCommand(world, {
    type: "start-charter",
    patron,
    runId: world.runId,
  });
}

function commandFor(world: World, choice: ChoiceId): Command {
  return {
    type: "charter-choice",
    runId: world.runId,
    revision: world.charter!.revision,
    choice,
  };
}

function choose(world: World, choice: ChoiceId) {
  expect(getCharterChoices(world).some((entry) => entry.id === choice)).toBe(
    true,
  );
  return applyCommand(world, commandFor(world, choice));
}

function assertAccounts(world: World) {
  for (const resource of ["timber", "ore"] as const) {
    const available =
      resource === "timber" ? world.forestTimber : world.mineOre;
    const accounted = world.settlements.reduce(
      (sum, group) =>
        sum +
        group.home[resource] +
        group.field[resource] +
        group.used[resource] +
        group.workshop.reserved[resource] +
        (group.convoy?.resource === resource ? group.convoy.amount : 0),
      available + world.player.inventory[resource],
    );
    expect(accounted).toBe(resource === "timber" ? 2000 : 1000);
  }
  const initial = createWorld(world.scenario, world.seed);
  const food = world.settlements.reduce(
    (sum, group) => sum + group.home.food + (group.convoy?.provisions ?? 0),
    world.player.inventory.food,
  );
  const openingFood = initial.settlements.reduce(
    (sum, group) => sum + group.home.food,
    initial.player.inventory.food,
  );
  expect(food + world.ledger.foodConsumed).toBe(
    openingFood + world.ledger.foodGathered,
  );
  expect(
    world.settlements.reduce(
      (sum, group) => sum + group.home.tools,
      world.player.inventory.tools,
    ),
  ).toBe(world.ledger.toolsCrafted);
  for (const group of world.settlements) {
    expect(
      Object.values(group.plan.workers).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
    ).toBe(group.workers);
    for (const amount of [
      ...Object.values(group.home),
      ...Object.values(group.field),
      ...Object.values(group.used),
      ...Object.values(group.workshop.reserved),
      ...Object.values(group.plan.workers),
      group.convoy?.amount ?? 0,
      group.convoy?.provisions ?? 0,
      ...Object.values(world.player.inventory),
    ]) {
      expect(Number.isInteger(amount)).toBe(true);
      expect(amount).toBeGreaterThanOrEqual(0);
    }
  }
}

function finish(world: World, preferred: ChoiceId[]) {
  for (let turns = 0; turns < 30 && !world.charter!.ending; turns++) {
    const choices = getCharterChoices(world);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.length).toBeLessThanOrEqual(3);
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(
      choices.length,
    );
    const id =
      preferred.find((candidate) =>
        choices.some((choice) => choice.id === candidate),
      ) ?? choices[0]!.id;
    const before = world;
    world = choose(world, id);
    expect(world.tick).toBeGreaterThan(before.tick);
    expect(world.tick - before.tick).toBeLessThanOrEqual(3);
    expect(world.tick).toBeLessThanOrEqual(world.charter!.deadline);
    expect(world.charter!.revision).toBe(before.charter!.revision + 1);
    expect(world.player.assignment).toBeNull();
    const report = world.charter!.reports.at(-1)!;
    expect(report).toMatchObject({
      choiceId: id,
      revision: world.charter!.revision,
      fromDay: before.tick,
      toDay: world.tick,
    });
    expect(report.title.length).toBeGreaterThan(0);
    expect(report.text.length).toBeGreaterThan(0);
    assertAccounts(world);
  }
  expect(world.charter!.ending).not.toBeNull();
  return world;
}

function reachChoice(world: World, prefix: string) {
  for (let turns = 0; turns < 21 && !world.charter!.ending; turns++) {
    const offered = getCharterChoices(world).find((choice) =>
      choice.id.startsWith(prefix),
    );
    if (offered) return { world, choice: offered.id };
    world = choose(world, "wait");
  }
  throw new Error(`The charter never offered a ${prefix} opportunity.`);
}

describe("guided charter decisions", () => {
  it("resolves productive work and both NPC economies in one bounded action", () => {
    const before = start();
    const result = choose(before, "work-willow");
    expect(result.tick).toBeGreaterThan(0);
    expect(result.tick).toBeLessThanOrEqual(3);
    expect(result.charter!.helped.willow).toBeGreaterThan(0);
    expect(result.charter!.trust.willow).toBe(before.charter!.trust.willow + 1);
    expect(result.charter!.trust.bracken).toBe(before.charter!.trust.bracken);
    expect(
      result.settlements[1]!.field.timber + result.settlements[1]!.field.ore,
    ).toBeGreaterThan(0);
    expect(result.player.assignment).toBeNull();
    expect(before).toEqual(start());
    assertAccounts(result);
  });

  it.each<SettlementId>(["willow", "bracken"])(
    "makes a successful %s pledge reachable through actual work",
    (patron) => {
      const world = finish(start(patron), [`work-${patron}`, "wait"]);
      expect(world.charter!.ending!.kind).not.toBe("missed");
      expect(world.charter!.trust[patron]).toBeGreaterThanOrEqual(2);
      expect(
        world.settlements.find((group) => group.id === patron)!.workshop
          .complete,
      ).toBe(true);
      expect(world.tick).toBeLessThanOrEqual(21);
      expect(world.charter!.ending!.workshops).toBeGreaterThan(
        world.charter!.ending!.baselineWorkshops,
      );
    },
  );

  it("ends an unattended pledge without gifting progress or trust", () => {
    const world = finish(start(), ["wait"]);
    expect(world.charter!.ending!.kind).toBe("missed");
    expect(world.tick).toBe(21);
    expect(world.charter!.helped).toEqual({ willow: 0, bracken: 0 });
    expect(world.charter!.trust).toEqual({ willow: 0, bracken: 0 });
    expect(world.charter!.ending!.workshops).toBe(
      world.charter!.ending!.baselineWorkshops,
    );
  });

  it("distinguishes cooperation with both villages from success bought at a neighbor's expense", () => {
    const shared = finish(start(), ["work-bracken", "work-willow", "wait"]);
    expect(shared.charter!.ending!.kind).toBe("shared");
    expect(shared.charter!.ending!.workshops).toBe(2);
    expect(shared.charter!.trust.willow).toBeGreaterThanOrEqual(2);
    expect(shared.charter!.trust.bracken).toBeGreaterThanOrEqual(2);
    const costly = finish(start(), [
      "raid-bracken",
      "supply-willow",
      "work-willow",
      "wait",
    ]);
    expect(costly.charter!.ending!.kind).toBe("costly");
    expect(costly.charter!.stolen).toBeGreaterThan(0);
    expect(costly.charter!.trust.bracken).toBeLessThan(0);
  });

  it("offers real convoy interference and a bounded use for the resulting cargo", () => {
    const opportunity = reachChoice(start(), "raid-");
    const before = opportunity.world;
    const target = opportunity.choice.endsWith("willow") ? "willow" : "bracken";
    const attacked = choose(before, opportunity.choice);
    expect(attacked.charter!.stolen).toBeGreaterThan(0);
    expect(attacked.charter!.trust[target]).toBe(
      before.charter!.trust[target] - 3,
    );
    expect(
      attacked.settlements.find((group) => group.id === target)!
        .threatFromPlayer,
    ).toBeGreaterThan(0);
    assertAccounts(attacked);
    const supply = getCharterChoices(attacked).find((choice) =>
      choice.id.startsWith("supply-"),
    );
    expect(supply).toBeDefined();
    const recipient = supply!.id.endsWith("willow") ? "willow" : "bracken";
    const recipientBefore = attacked.settlements.find(
      (group) => group.id === recipient,
    )!;
    const remainingNeed =
      rawOutstanding(recipientBefore, "timber") +
      rawOutstanding(recipientBefore, "ore");
    const packBefore =
      attacked.player.inventory.timber + attacked.player.inventory.ore;
    const delivered = choose(attacked, supply!.id);
    const transfer =
      packBefore -
      delivered.player.inventory.timber -
      delivered.player.inventory.ore;
    expect(transfer).toBeGreaterThan(0);
    expect(transfer).toBeLessThanOrEqual(Math.min(8, remainingNeed));
    expect(
      delivered.charter!.supplied[recipient] -
        attacked.charter!.supplied[recipient],
    ).toBe(transfer);
    expect(delivered.player.inventory.food).toBe(
      attacked.player.inventory.food - 1,
    );
    assertAccounts(delivered);
  });

  it("does not award trust for unavailable or zero-output shifts", () => {
    const world = start();
    world.forestTimber = 0;
    const snapshot = structuredClone(world);
    expect(
      getCharterChoices(world).some((choice) => choice.id.startsWith("work-")),
    ).toBe(false);
    expect(() =>
      applyCommand(world, commandFor(world, "work-willow")),
    ).toThrow();
    expect(world).toEqual(snapshot);
  });

  it("hides a shift when NPCs can already fill the order before the player works", () => {
    const world = start();
    const group = world.settlements[0]!;
    // Move actual stocks into an almost-filled requisition and an in-flight
    // ore delivery. The lone missing timber becomes the NPC crew's next job.
    group.field.timber = 23;
    world.forestTimber -= 23;
    world.mineOre -= 8;
    group.home.food -= 2;
    group.convoy = {
      id: "convoy-1",
      resource: "ore",
      amount: 8,
      travelRemaining: 2,
      escorts: 0,
      provisions: 2,
      intercepted: false,
    };
    world.nextConvoyId = 2;
    const snapshot = structuredClone(world);
    expect(
      getCharterChoices(world).some((choice) => choice.id === "work-willow"),
    ).toBe(false);
    expect(() => applyCommand(world, commandFor(world, "work-willow"))).toThrow(
      "no longer available",
    );
    expect(world).toEqual(snapshot);
    expect(world.charter!.helped.willow).toBe(0);
    expect(world.charter!.trust.willow).toBe(0);
    assertAccounts(world);
  });

  it("keeps every offered first choice affordable and bounded", () => {
    let frontier = [start()];
    // Exercise the contextual choice combinations, including raid and supply,
    // without testing only a hand-picked winning route.
    for (let depth = 0; depth < 5; depth++) {
      const next: World[] = [];
      for (const world of frontier) {
        const choices = getCharterChoices(world);
        expect(choices.length).toBeLessThanOrEqual(3);
        for (const choice of choices) {
          const result = applyCommand(world, commandFor(world, choice.id));
          expect(result.tick).toBeGreaterThan(world.tick);
          expect(result.charter!.trust.willow).toBeLessThanOrEqual(5);
          expect(result.charter!.trust.bracken).toBeLessThanOrEqual(5);
          assertAccounts(result);
          if (!result.charter!.ending) next.push(result);
        }
      }
      frontier = next;
    }
  });

  it("replays the complete choice sequence and result deterministically", () => {
    const run = () =>
      finish(start(), ["raid-bracken", "supply-willow", "work-willow", "wait"]);
    expect(run()).toEqual(run());
  });
});

describe("charter transaction boundaries", () => {
  it("rejects stale revisions, old runs, and lab actions without mutation", () => {
    const before = start();
    const stale = commandFor(before, "work-willow");
    const after = applyCommand(before, stale);
    const snapshot = structuredClone(after);
    expect(() => applyCommand(after, stale)).toThrow();
    for (const command of [
      { type: "advance", steps: 1 },
      { type: "next-convoy" },
      { type: "join", settlementId: "willow", profile: "skilled" },
      { type: "leave" },
    ] as Command[])
      expect(() => applyCommand(after, command)).toThrow();
    expect(after).toEqual(snapshot);
    const reset = applyCommand(after, { type: "reset" });
    expect(reset.runId).toBeGreaterThan(after.runId);
    expect(reset.charter).toBeNull();
    expect(() =>
      applyCommand(reset, {
        type: "start-charter",
        patron: "willow",
        runId: before.runId,
      }),
    ).toThrow();
    const restarted = applyCommand(reset, {
      type: "start-charter",
      patron: "willow",
      runId: reset.runId,
    });
    expect(restarted.runId).toBeGreaterThan(reset.runId);
    expect(() => applyCommand(restarted, stale)).toThrow();
  });

  it("rejects further choices after the ending", () => {
    const ended = finish(start(), ["wait"]);
    expect(getCharterChoices(ended)).toEqual([]);
    expect(() => applyCommand(ended, commandFor(ended, "wait"))).toThrow();
    expect(applyCommand(ended, { type: "reset" }).charter).toBeNull();
  });

  it("deduplicates a whole shift and rejects a distinct command using its stale revision", () => {
    const service = createScenarioService();
    const started = service.execute("begin", {
      type: "start-charter",
      patron: "willow",
      runId: service.snapshot().runId,
    });
    const command = commandFor(started, "work-willow");
    const completed = service.execute("shift", command);
    const expected = structuredClone(completed);
    completed.charter!.trust.willow = 999;
    for (let i = 0; i < 5; i++)
      expect(service.execute("shift", command)).toEqual(expected);
    expect(() => service.execute("other-shift", command)).toThrow();
    expect(service.snapshot()).toEqual(expected);
  });

  it("rejects forged rewards, unknown options, coercions and unbounded identifiers", () => {
    for (const command of [
      { type: "start-charter", patron: "admin", runId: 1 },
      { type: "start-charter", patron: "willow", runId: "1" },
      { type: "start-charter", patron: "willow", runId: -1 },
      {
        type: "start-charter",
        patron: "willow",
        runId: Number.MAX_SAFE_INTEGER + 1,
      },
      { type: "charter-choice", runId: 1, revision: 0, choice: "free-tools" },
      { type: "charter-choice", runId: 1, revision: "0", choice: "wait" },
      { type: "charter-choice", runId: 1, revision: -1, choice: "wait" },
      {
        type: "charter-choice",
        runId: 1,
        revision: 0,
        choice: "work-willow",
        reward: 100,
      },
      {
        type: "charter-choice",
        runId: 1,
        revision: 0,
        choice: "wait",
        days: 100,
      },
    ])
      expect(isCommand(command)).toBe(false);
  });
});
