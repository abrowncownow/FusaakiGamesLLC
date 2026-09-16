import {
  WORLD_VERSION,
  WORKSHOP_COST,
  TOOL_COST,
  TRAVEL_DAYS,
  inventory,
  type Command,
  type World,
  type Scenario,
  type Settlement,
  type SettlementId,
  type RawResource,
} from "./model.js";
import { canHarvest, planFor, rawOutstanding } from "./planner.js";
import { newCharter } from "./charter.js";
import { executeCharterChoice } from "./charter-engine.js";
import { newJourney } from "./journey.js";
import { executeJourneyAction } from "./journey-engine.js";

function record(
  world: World,
  kind: World["events"][number]["kind"],
  text: string,
) {
  world.events.push({ tick: world.tick, kind, text });
  world.events = world.events.slice(-120);
}

function refreshPlans(world: World) {
  for (const group of world.settlements) group.plan = planFor(world, group);
}

export function createWorld(scenario: Scenario = "balanced", seed = 7): World {
  const world: World = {
    version: WORLD_VERSION,
    runId: 0,
    charter: null,
    journey: null,
    tick: 0,
    seed,
    randomState: seed,
    scenario,
    forestTimber: 2000,
    mineOre: 1000,
    nextConvoyId: 1,
    player: {
      assignment: null,
      inventory: { ...inventory(), food: 6 },
      lastRaidTick: null,
    },
    ledger: { foodGathered: 0, foodConsumed: 0, toolsCrafted: 0 },
    settlements: [],
    events: [],
  };
  for (const [id, name, growth, security] of [
    ["willow", "Willow village", 1, 1.6],
    ["bracken", "Bracken camp", 1.2, 1.1],
  ] as const) {
    const workers = scenario === "small-crew" ? 2 : 4;
    const group = {
      id,
      name,
      workers,
      home: {
        ...inventory(),
        food: scenario === "food-shortage" ? 0 : workers * 6,
      },
      field: { timber: 0, ore: 0 },
      used: { timber: 0, ore: 0 },
      workshop: { complete: false, work: 0, reserved: { timber: 0, ore: 0 } },
      convoy: null,
      priorities: { growth, security },
      threatFromPlayer: 0,
      losses: { timber: 0, ore: 0 },
      lastAction: "",
    };
    world.settlements.push({
      ...group,
      plan: planFor(world, group as Settlement),
    });
  }
  record(
    world,
    "project",
    "Both communities want a workshop: 24 timber and 8 ore, followed by a two-tool order. NPC crews choose the work and keep themselves fed.",
  );
  return world;
}

const settlementId = (value: unknown): value is SettlementId =>
  value === "willow" || value === "bracken";

export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const command = value as Record<string, unknown>;
  const keys = Object.keys(command).sort().join(",");
  switch (command.type) {
    case "start-journey":
      return (
        keys === "runId,type" &&
        Number.isSafeInteger(command.runId) &&
        (command.runId as number) >= 0
      );
    case "journey-action":
      return (
        keys === "action,revision,runId,type" &&
        Number.isSafeInteger(command.runId) &&
        (command.runId as number) >= 0 &&
        Number.isSafeInteger(command.revision) &&
        (command.revision as number) >= 0 &&
        typeof command.action === "string" &&
        [
          "travel-willow",
          "travel-bracken",
          "travel-wood",
          "travel-mine",
          "travel-ruins",
          "gather-timber",
          "gather-ore",
          "deliver-willow",
          "deliver-bracken",
          "build-willow",
          "build-bracken",
          "rest",
          "discover-ruins",
        ].includes(command.action)
      );
    case "start-charter":
      return (
        keys === "patron,runId,type" &&
        settlementId(command.patron) &&
        Number.isSafeInteger(command.runId) &&
        (command.runId as number) >= 0
      );
    case "charter-choice":
      return (
        keys === "choice,revision,runId,type" &&
        Number.isSafeInteger(command.runId) &&
        (command.runId as number) >= 0 &&
        Number.isSafeInteger(command.revision) &&
        (command.revision as number) >= 0 &&
        typeof command.choice === "string" &&
        [
          "work-willow",
          "work-bracken",
          "raid-willow",
          "raid-bracken",
          "supply-willow",
          "supply-bracken",
          "wait",
        ].includes(command.choice)
      );
    case "advance":
      return (
        keys === "steps,type" &&
        Number.isInteger(command.steps) &&
        (command.steps as number) >= 1 &&
        (command.steps as number) <= 30
      );
    case "join":
      return (
        keys === "profile,settlementId,type" &&
        settlementId(command.settlementId) &&
        (command.profile === "novice" || command.profile === "skilled")
      );
    case "intercept":
      return (
        keys === "convoyId,settlementId,type" &&
        settlementId(command.settlementId) &&
        typeof command.convoyId === "string" &&
        /^convoy-[1-9][0-9]{0,12}$/.test(command.convoyId)
      );
    case "reset":
      return (
        Object.keys(command).every((key) =>
          ["type", "scenario", "seed"].includes(key),
        ) &&
        (!("scenario" in command) ||
          (typeof command.scenario === "string" &&
            ["balanced", "food-shortage", "small-crew"].includes(
              command.scenario,
            ))) &&
        (!("seed" in command) ||
          (Number.isInteger(command.seed) &&
            (command.seed as number) >= 0 &&
            (command.seed as number) <= 0xffffffff))
      );
    case "leave":
    case "next-convoy":
      return keys === "type";
    default:
      return false;
  }
}

function gather(
  world: World,
  group: Settlement,
  resource: RawResource,
  amount: number,
) {
  const pool = resource === "timber" ? "forestTimber" : "mineOre";
  const gathered = Math.min(
    amount,
    rawOutstanding(group, resource),
    world[pool],
  );
  world[pool] -= gathered;
  group.field[resource] += gathered;
  return gathered;
}

function buildWorkshop(world: World, group: Settlement, workers: number) {
  if (group.workshop.work === 0) {
    for (const resource of ["timber", "ore"] as const) {
      group.home[resource] -= WORKSHOP_COST[resource];
      group.workshop.reserved[resource] += WORKSHOP_COST[resource];
    }
  }
  group.workshop.work = Math.min(6, group.workshop.work + workers);
  if (group.workshop.work === 6) {
    group.workshop.complete = true;
    for (const resource of ["timber", "ore"] as const) {
      group.used[resource] += group.workshop.reserved[resource];
      group.workshop.reserved[resource] = 0;
    }
    record(
      world,
      "project",
      `${group.name} completed its workshop. Toolmaking is now available; the crew placed an order for two tools.`,
    );
  }
}

function step(world: World) {
  world.tick++;
  for (const group of world.settlements) {
    if (group.convoy && --group.convoy.travelRemaining === 0) {
      const { amount, resource, provisions } = group.convoy;
      group.home[resource] += amount;
      group.home.food += provisions;
      group.convoy = null;
      record(
        world,
        "shipment",
        `${group.name}'s convoy delivered ${amount} ${resource}. Its crew returned to work.`,
      );
    }
    const plan = planFor(world, group);
    const action = plan.chosen.action;
    const key = `${plan.chosen.label}:${plan.workers.foraging}`;
    if (key !== group.lastAction) {
      record(
        world,
        "decision",
        `${group.name}: ${plan.chosen.label}. ${plan.chosen.reason}`,
      );
      group.lastAction = key;
    }
    const food = plan.workers.foraging * 4;
    group.home.food += food;
    world.ledger.foodGathered += food;
    switch (action.type) {
      case "gather":
        gather(world, group, action.resource, action.workers);
        break;
      case "dispatch": {
        const provisions = (1 + action.escorts) * TRAVEL_DAYS;
        group.field[action.resource] -= action.amount;
        group.home.food -= provisions;
        group.convoy = {
          id: `convoy-${world.nextConvoyId++}`,
          resource: action.resource,
          amount: action.amount,
          escorts: action.escorts,
          travelRemaining: TRAVEL_DAYS,
          provisions,
          intercepted: false,
        };
        record(
          world,
          "shipment",
          `${group.name} dispatched ${action.amount} ${action.resource} with ${action.escorts} escorts, committing ${1 + action.escorts} workers and ${provisions} rations.`,
        );
        break;
      }
      case "build": {
        buildWorkshop(world, group, action.workers);
        break;
      }
      case "craft": {
        for (const resource of ["timber", "ore"] as const) {
          group.home[resource] -= TOOL_COST[resource];
          group.used[resource] += TOOL_COST[resource];
        }
        group.home.tools++;
        world.ledger.toolsCrafted++;
        record(
          world,
          "project",
          `${group.name} crafted a tool from 2 timber and 1 ore (${group.home.tools}/2).`,
        );
        break;
      }
      case "rest":
        break;
    }
    const assignment = world.player.assignment;
    const playerWorking = assignment?.settlementId === group.id;
    if (playerWorking) {
      const contributed = gather(
        world,
        group,
        "timber",
        assignment.profile === "skilled" ? 4 : 2,
      );
      if (world.charter) world.charter.helped[group.id] += contributed;
      if (!canHarvest(world, group)) {
        world.player.assignment = null;
        record(
          world,
          "player",
          `${group.name}'s timber requisition is filled or its source exhausted. You left the crew; NPCs handle the remaining work.`,
        );
      }
    }
    // A journey's three meals are eaten on departure day and the next two days.
    // On arrival day the crew rejoins the home food budget.
    const away = group.convoy ? 1 + group.convoy.escorts : 0;
    if (group.convoy) group.convoy.provisions -= away;
    const meals = group.workers - away + (playerWorking ? 1 : 0);
    group.home.food -= meals;
    world.ledger.foodConsumed += meals + away;
  }
  refreshPlans(world);
}

function intercept(
  world: World,
  command: Extract<Command, { type: "intercept" }>,
) {
  const group = world.settlements.find(
    (entry) => entry.id === command.settlementId,
  )!;
  const convoy = group.convoy;
  if (!convoy || convoy.id !== command.convoyId)
    throw new Error("That convoy is no longer on the road. Refresh the world.");
  if (convoy.intercepted)
    throw new Error("This convoy has already faced an interception.");
  if (world.player.assignment)
    throw new Error("Leave your work crew before intercepting a convoy.");
  if (world.player.lastRaidTick === world.tick)
    throw new Error("You can intercept only one convoy per day.");
  if (world.player.inventory.food < 1)
    throw new Error(
      "You have no travel rations left. Reset the experiment to try another route.",
    );
  convoy.intercepted = true;
  world.player.lastRaidTick = world.tick;
  world.player.inventory.food--;
  world.ledger.foodConsumed++;
  // Fixed integer PRNG keeps the same seed and command sequence replayable.
  world.randomState =
    (Math.imul(1664525, world.randomState) + 1013904223) >>> 0;
  const roll = 6 + ((world.randomState >>> 16) % 5);
  const loot =
    convoy.escorts >= 2
      ? 0
      : Math.min(convoy.amount, Math.max(1, roll - convoy.escorts * 3));
  convoy.amount -= loot;
  world.player.inventory[convoy.resource] += loot;
  group.losses[convoy.resource] += loot;
  group.threatFromPlayer = Math.min(
    100,
    group.threatFromPlayer + (loot ? 50 : 15),
  );
  record(
    world,
    "raid",
    loot
      ? `You intercepted ${group.name}'s convoy and took ${loot} ${convoy.resource}. It continues with ${convoy.amount}. Missing cargo must be replaced; the community now rates your route threat ${group.threatFromPlayer}/100.`
      : `${group.name}'s two escorts repelled your interception. Your ration was spent; no cargo changed hands. The guards remain away from other work until arrival.`,
  );
}

export function applyCommand(current: World, command: Command): World {
  if (!isCommand(command)) throw new Error("Invalid scenario command.");
  if (command.type === "reset") {
    const reset = createWorld(command.scenario, command.seed);
    // Delayed commands from another tab must not match convoys in a new run.
    reset.nextConvoyId = current.nextConvoyId;
    reset.runId = current.runId + 1;
    return reset;
  }
  if (command.type === "start-charter") {
    if (command.runId !== current.runId)
      throw new Error(
        "This world has changed. Refresh before starting another charter.",
      );
    const started = createWorld();
    started.runId = current.runId + 1;
    started.nextConvoyId = current.nextConvoyId;
    started.charter = newCharter(command.patron);
    return started;
  }
  if (command.type === "start-journey") {
    if (command.runId !== current.runId)
      throw new Error(
        "This world has changed. Refresh before starting another journey.",
      );
    const started = createWorld();
    started.runId = current.runId + 1;
    started.nextConvoyId = current.nextConvoyId;
    started.journey = newJourney();
    return started;
  }
  const world = structuredClone(current);
  if (command.type === "journey-action") {
    executeJourneyAction(world, command, {
      step,
      build: (state, id) =>
        buildWorkshop(
          state,
          state.settlements.find((group) => group.id === id)!,
          1,
        ),
    });
    refreshPlans(world);
    return world;
  }
  if (command.type === "charter-choice") {
    executeCharterChoice(world, command, { step, createWorld, intercept });
    refreshPlans(world);
    return world;
  }
  if (world.charter)
    throw new Error(
      "This world is a charter run. Use its choices, or reset the World Lab for an experiment.",
    );
  if (world.journey)
    throw new Error(
      "This world is an exploration journey. Use local actions, or reset the World Lab for an experiment.",
    );
  switch (command.type) {
    case "join": {
      const group = world.settlements.find(
        (entry) => entry.id === command.settlementId,
      )!;
      if (world.player.assignment)
        throw new Error("Leave your current crew before joining another.");
      if (!canHarvest(world, group))
        throw new Error("This crew has no open timber requisition.");
      world.player.assignment = {
        settlementId: command.settlementId,
        profile: command.profile,
      };
      record(
        world,
        "player",
        `You joined ${group.name}'s timber crew as a ${command.profile === "skilled" ? "skilled" : "new"} harvester. The settlement provides one meal per working day.`,
      );
      break;
    }
    case "leave":
      if (world.player.assignment)
        record(
          world,
          "player",
          "You left the crew. Completed work stays; NPC workers continue the requisition.",
        );
      world.player.assignment = null;
      break;
    case "intercept":
      intercept(world, command);
      break;
    case "advance":
      for (let i = 0; i < command.steps; i++) step(world);
      break;
    case "next-convoy": {
      let days = 0;
      while (
        days < 30 &&
        !world.settlements.some(
          (group) => group.convoy && !group.convoy.intercepted,
        )
      ) {
        step(world);
        days++;
      }
      if (
        days === 30 &&
        !world.settlements.some(
          (group) => group.convoy && !group.convoy.intercepted,
        )
      )
        record(
          world,
          "shipment",
          "Thirty days passed without an available convoy. Check the settlements' current needs.",
        );
      break;
    }
  }
  refreshPlans(world);
  return world;
}
