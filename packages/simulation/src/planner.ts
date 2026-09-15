import {
  CONVOY_CAPACITY,
  TOOL_COST,
  TOOL_TARGET,
  TRAVEL_DAYS,
  WORKSHOP_COST,
  type Candidate,
  type Plan,
  type RawResource,
  type Settlement,
  type World,
} from "./model.js";

export function rawGoal(group: Settlement, resource: RawResource): number {
  return group.workshop.complete
    ? Math.max(0, TOOL_TARGET - group.home.tools) * TOOL_COST[resource]
    : WORKSHOP_COST[resource];
}

export function committedRaw(group: Settlement, resource: RawResource): number {
  return (
    group.home[resource] +
    group.field[resource] +
    group.workshop.reserved[resource] +
    (group.convoy?.resource === resource ? group.convoy.amount : 0)
  );
}

export function rawOutstanding(
  group: Settlement,
  resource: RawResource,
): number {
  return Math.max(0, rawGoal(group, resource) - committedRaw(group, resource));
}

export function canHarvest(world: World, group: Settlement): boolean {
  return world.forestTimber > 0 && rawOutstanding(group, "timber") > 0;
}

export function planFor(world: World, group: Settlement): Plan {
  const traveling = group.convoy ? 1 + group.convoy.escorts : 0;
  const homeWorkers = group.workers - traveling;
  const guest = world.player.assignment?.settlementId === group.id ? 1 : 0;
  const foraging = Math.min(
    homeWorkers,
    Math.ceil(Math.max(0, 3 * (homeWorkers + guest) - group.home.food) / 4),
  );
  const available = homeWorkers - foraging;
  const foodAfterForage = group.home.food + foraging * 4;
  const candidates: Candidate[] = [];
  for (const resource of ["timber", "ore"] as const) {
    const needed = rawOutstanding(group, resource);
    const pool = resource === "timber" ? world.forestTimber : world.mineOre;
    candidates.push({
      label: resource === "timber" ? "Harvest timber" : "Mine ore",
      action: { type: "gather", resource, workers: Math.min(2, available) },
      score: Math.round(
        group.priorities.growth *
          (15 + (20 * needed) / Math.max(1, rawGoal(group, resource))),
      ),
      feasible: needed > 0 && pool > 0 && available > 0,
      reason:
        needed === 0
          ? `Enough ${resource} is already committed.`
          : pool === 0
            ? `The ${resource} source is exhausted.`
            : available === 0
              ? "All available workers are securing food."
              : `${needed} more ${resource} needed for ${group.workshop.complete ? "tools" : "the workshop"}.`,
    });
    const homeDeficit = Math.max(
      0,
      rawGoal(group, resource) -
        group.home[resource] -
        group.workshop.reserved[resource],
    );
    const fullLoad = Math.min(CONVOY_CAPACITY, homeDeficit);
    // A crew that cannot afford guards can reduce its exposure by shipping less.
    // This avoids a permanent deadlock when a full load is too risky to dispatch.
    const loads =
      group.threatFromPlayer >= 75 && fullLoad > 4 ? [fullLoad, 4] : [fullLoad];
    for (const amount of loads) {
      for (const escorts of [0, 1, 2]) {
        const party = 1 + escorts;
        const cargoReady = amount > 0 && group.field[resource] >= amount;
        // Always leave a resident behind who can maintain the food supply.
        const crewReady = party <= available && party < homeWorkers;
        const foodReady =
          foodAfterForage >= party * TRAVEL_DAYS + homeWorkers - party + guest;
        const risk =
          (group.threatFromPlayer / 100) *
          (1 - escorts / 2) *
          amount *
          4 *
          group.priorities.security;
        candidates.push({
          label: `Ship ${resource} · ${escorts} escorts${amount < fullLoad ? " · light load" : ""}`,
          action: { type: "dispatch", resource, escorts, amount },
          score: Math.round(
            60 * group.priorities.growth -
              risk -
              escorts * 4 -
              (amount < fullLoad ? 10 : 0),
          ),
          feasible: !group.convoy && cargoReady && crewReady && foodReady,
          reason: group.convoy
            ? "The caravan is already on the road."
            : !cargoReady
              ? `Waiting for ${amount || "needed"} ${resource} at the source.`
              : !crewReady
                ? "Not enough spare workers; someone must keep the settlement fed."
                : !foodReady
                  ? `Needs ${party * TRAVEL_DAYS} travel rations plus today's meals.`
                  : `${amount} ${resource}; ${party} workers and ${party * TRAVEL_DAYS} rations. Route risk ${group.threatFromPlayer}/100 lowers the score of exposed cargo.`,
        });
      }
    }
  }
  const inputsReady = (["timber", "ore"] as const).every(
    (resource) =>
      group.home[resource] + group.workshop.reserved[resource] >=
      WORKSHOP_COST[resource],
  );
  candidates.push({
    label: "Build workshop",
    action: { type: "build", workers: available },
    score: Math.round(80 * group.priorities.growth),
    feasible: !group.workshop.complete && inputsReady && available > 0,
    reason: group.workshop.complete
      ? "The workshop is built."
      : !inputsReady
        ? "Needs 24 timber and 8 ore delivered home."
        : available === 0
          ? "Food takes priority over construction."
          : `${6 - group.workshop.work} work remaining; delivered materials are reserved for construction.`,
  });
  candidates.push({
    label: "Craft tools",
    action: { type: "craft", workers: 2 },
    score: Math.round(75 * group.priorities.growth),
    feasible:
      group.workshop.complete &&
      group.home.tools < TOOL_TARGET &&
      group.home.timber >= TOOL_COST.timber &&
      group.home.ore >= TOOL_COST.ore &&
      available >= 2,
    reason: !group.workshop.complete
      ? "Requires a workshop."
      : group.home.tools >= TOOL_TARGET
        ? "The starter tool order is complete."
        : "Needs 2 workers, 2 timber and 1 ore for each tool.",
  });
  candidates.push({
    label: foraging ? "Secure food" : "Maintain settlement",
    action: { type: "rest" },
    score: 1,
    feasible: true,
    reason: foraging
      ? `Restock food first: ${foraging} foragers protect a three-day reserve.`
      : group.home.tools >= TOOL_TARGET
        ? "Starter goals complete. Residents continue feeding themselves."
        : "Waiting for labor, deliveries or resources to become available.",
  });
  const chosen = candidates
    .filter((candidate) => candidate.feasible)
    .sort((a, b) => b.score - a.score)[0]!;
  const action = chosen.action;
  const production = "workers" in action ? action.workers : 0;
  const departing = action.type === "dispatch" ? 1 + action.escorts : 0;
  return {
    chosen,
    candidates,
    workers: {
      foraging,
      production,
      traveling: traveling + departing,
      resting: homeWorkers - foraging - production - departing,
    },
  };
}

export function reasonFor(group: Settlement): string {
  return group.plan.chosen.reason;
}
