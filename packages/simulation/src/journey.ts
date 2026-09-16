import { WORKSHOP_COST, type SettlementId, type World } from "./model.js";
import { rawOutstanding } from "./planner.js";

export type JourneyPlaceId = "willow" | "bracken" | "wood" | "mine" | "ruins";
export type JourneyActionId =
  | `travel-${JourneyPlaceId}`
  | "gather-timber"
  | "gather-ore"
  | "deliver-willow"
  | "deliver-bracken"
  | "build-willow"
  | "build-bracken"
  | "rest"
  | "discover-ruins";

export interface JourneyReport {
  revision: number;
  title: string;
  text: string;
  fromDay: number;
  toDay: number;
}

export interface JourneyRun {
  location: JourneyPlaceId;
  revision: number;
  visited: JourneyPlaceId[];
  delivered: Record<SettlementId, number>;
  gathered: { timber: number; ore: number };
  reports: JourneyReport[];
  discovery: boolean;
}

export interface JourneyAction {
  id: JourneyActionId;
  title: string;
  description: string;
  cost: string;
  kind: "travel" | "gather" | "deliver" | "build" | "rest" | "discover";
  destination?: JourneyPlaceId;
}

export const JOURNEY_PLACES: ReadonlyArray<{
  id: JourneyPlaceId;
  name: string;
  x: number;
  y: number;
  description: string;
}> = [
  {
    id: "wood",
    name: "The Common Wood",
    x: 320,
    y: 235,
    description:
      "Axes ring between the trees. Both villages depend on this forest.",
  },
  {
    id: "willow",
    name: "Willow village",
    x: 220,
    y: 475,
    description:
      "Mara's crew is turning a patch of bare earth into a workshop.",
  },
  {
    id: "bracken",
    name: "Bracken camp",
    x: 750,
    y: 460,
    description:
      "Nix insists this is a future town. The tents have yet to be consulted.",
  },
  {
    id: "mine",
    name: "Grey Ridge Mine",
    x: 740,
    y: 170,
    description:
      "Ore veins run beneath the ridge. A broken stair climbs toward an old lookout.",
  },
  {
    id: "ruins",
    name: "The Old Lookout",
    x: 450,
    y: 95,
    description:
      "An abandoned watchtower overlooks the valley. Its trail markers may still lead somewhere.",
  },
];

export const JOURNEY_ROUTES: ReadonlyArray<
  readonly [JourneyPlaceId, JourneyPlaceId]
> = [
  ["wood", "willow"],
  ["wood", "bracken"],
  ["wood", "mine"],
  ["mine", "ruins"],
];

export function newJourney(): JourneyRun {
  return {
    location: "wood",
    revision: 0,
    visited: ["wood"],
    delivered: { willow: 0, bracken: 0 },
    gathered: { timber: 0, ore: 0 },
    reports: [],
    discovery: false,
  };
}

export function journeyDelivery(world: World, id: SettlementId) {
  const group = world.settlements.find((entry) => entry.id === id)!;
  const amounts = { timber: 0, ore: 0 };
  let capacity = 8;
  for (const resource of ["timber", "ore"] as const) {
    amounts[resource] = Math.min(
      capacity,
      world.player.inventory[resource],
      rawOutstanding(group, resource),
    );
    capacity -= amounts[resource];
  }
  return amounts;
}

export function getJourneyActions(world: World): JourneyAction[] {
  const run = world.journey;
  if (!run) return [];
  const actions: JourneyAction[] = [];
  if (run.location === "wood" && world.forestTimber > 0)
    actions.push({
      id: "gather-timber",
      title: "Chop timber",
      kind: "gather",
      description: `Cut ${Math.min(4, world.forestTimber)} timber and carry it in your pack. Choose where it goes.`,
      cost: "1 day",
    });
  if (run.location === "mine" && world.mineOre > 0)
    actions.push({
      id: "gather-ore",
      title: "Mine ore",
      kind: "gather",
      description: `Break out ${Math.min(2, world.mineOre)} ore and carry it in your pack.`,
      cost: "1 day",
    });
  if (run.location === "willow" || run.location === "bracken") {
    const id = run.location;
    const group = world.settlements.find((entry) => entry.id === id)!;
    const amounts = journeyDelivery(world, id);
    if (amounts.timber + amounts.ore > 0)
      actions.push({
        id: `deliver-${id}`,
        title: "Deliver your supplies",
        kind: "deliver",
        description: `Give ${amounts.timber} timber and ${amounts.ore} ore to ${group.name}'s current order.`,
        cost: "1 day · the goods",
      });
    if (
      !group.workshop.complete &&
      (["timber", "ore"] as const).every(
        (resource) =>
          group.home[resource] + group.workshop.reserved[resource] >=
          WORKSHOP_COST[resource],
      )
    )
      actions.push({
        id: `build-${id}`,
        title: "Raise the workshop",
        kind: "build",
        description:
          "Add one day's building work. The materials are here, and the crew will work alongside you.",
        cost: "1 day",
      });
  }
  if (run.location === "ruins" && !run.discovery)
    actions.push({
      id: "discover-ruins",
      title: "Survey the old lookout",
      kind: "discover",
      description:
        "Follow the old trail markers. There may be another way down to Willow.",
      cost: "1 day",
    });
  const routes = run.discovery
    ? [...JOURNEY_ROUTES, ["ruins", "willow"] as const]
    : JOURNEY_ROUTES;
  for (const [from, to] of routes) {
    const destination =
      from === run.location ? to : to === run.location ? from : null;
    if (!destination) continue;
    const place = JOURNEY_PLACES.find((entry) => entry.id === destination)!;
    actions.push({
      id: `travel-${destination}`,
      title: `Travel to ${place.name}`,
      description: place.description,
      cost: "1 day",
      kind: "travel",
      destination,
    });
  }
  actions.push({
    id: "rest",
    title: "Watch the valley",
    description:
      "Spend a day here while the crews work and their wagons travel.",
    cost: "1 day",
    kind: "rest",
  });
  return actions;
}
