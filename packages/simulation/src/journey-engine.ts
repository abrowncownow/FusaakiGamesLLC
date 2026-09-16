import type { Command, SettlementId, World } from "./model.js";
import {
  getJourneyActions,
  JOURNEY_PLACES,
  journeyDelivery,
} from "./journey.js";

interface JourneyEffects {
  step(world: World): void;
  build(world: World, id: SettlementId): void;
}

export function executeJourneyAction(
  world: World,
  command: Extract<Command, { type: "journey-action" }>,
  effects: JourneyEffects,
) {
  const run = world.journey;
  if (
    !run ||
    command.runId !== world.runId ||
    command.revision !== run.revision
  )
    throw new Error(
      "This action is out of date. Refresh the valley before acting again.",
    );
  const action = getJourneyActions(world).find(
    (entry) => entry.id === command.action,
  );
  if (!action)
    throw new Error(
      "That action is not available here. Choose a place or activity in your current location.",
    );
  const fromDay = world.tick;
  let title = "A day in the valley.";
  let text = "You watched the crews carry on with their work.";
  if (action.kind === "travel" && action.destination) {
    run.location = action.destination;
    const place = JOURNEY_PLACES.find((entry) => entry.id === run.location)!;
    const firstVisit = !run.visited.includes(run.location);
    if (firstVisit) run.visited.push(run.location);
    title = `${firstVisit ? "Discovered" : "Arrived at"} ${place.name}.`;
    text = `${place.description} The valley carried on while you traveled.`;
  } else if (action.kind === "gather") {
    const resource = action.id === "gather-timber" ? "timber" : "ore";
    const pool = resource === "timber" ? "forestTimber" : "mineOre";
    const amount = Math.min(resource === "timber" ? 4 : 2, world[pool]);
    world[pool] -= amount;
    world.player.inventory[resource] += amount;
    run.gathered[resource] += amount;
    title = `${amount} ${resource} in your pack.`;
    text = `You gathered ${amount} ${resource}. Carry it to a village that needs it, or keep exploring with it.`;
  } else if (action.kind === "deliver") {
    const id = run.location as SettlementId;
    const group = world.settlements.find((entry) => entry.id === id)!;
    const amounts = journeyDelivery(world, id);
    for (const resource of ["timber", "ore"] as const) {
      world.player.inventory[resource] -= amounts[resource];
      group.home[resource] += amounts[resource];
    }
    run.delivered[id] += amounts.timber + amounts.ore;
    title = `${group.name} has your supplies.`;
    text = `${amounts.timber} timber and ${amounts.ore} ore moved from your pack into the village store. ${id === "willow" ? "Mara pats the nearest beam. ‘That is what I call a sound argument.’" : "Nix counts the delivery twice. ‘Once for the records. Once for the pleasure.’"}`;
  } else if (action.kind === "build") {
    effects.build(world, run.location as SettlementId);
    title = "Your hands on the workshop.";
    text =
      "You added one building work before the crew continued. The materials and progress belong to the village.";
  } else if (action.kind === "discover") {
    run.discovery = true;
    title = "An old path to Willow.";
    text =
      "Under the ivy, the trail markers still point down the ridge. You found a direct route between the lookout and Willow: one day instead of three. Someone has scratched ‘definitely not a shortcut’ into the first sign.";
  }
  effects.step(world);
  if (action.kind === "rest") {
    const news = world.events.filter(
      (event) =>
        event.tick > fromDay &&
        (event.kind === "shipment" || event.kind === "project"),
    );
    text =
      news.at(-1)?.text ??
      world.settlements
        .map(
          (group) => `${group.name}: ${group.plan.chosen.label.toLowerCase()}.`,
        )
        .join(" ");
  }
  run.revision++;
  run.reports.push({
    revision: run.revision,
    title,
    text,
    fromDay,
    toDay: world.tick,
  });
  run.reports = run.reports.slice(-80);
}
