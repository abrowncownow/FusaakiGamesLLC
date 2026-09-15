import type { Settlement, SettlementId, World } from "./model.js";
import { canHarvest, planFor, rawOutstanding } from "./planner.js";

export type CharterChoiceId =
  | "work-willow"
  | "work-bracken"
  | "raid-willow"
  | "raid-bracken"
  | "supply-willow"
  | "supply-bracken"
  | "wait";

export interface CharterChoice {
  id: CharterChoiceId;
  title: string;
  description: string;
  cost: string;
  tone: "help" | "risk" | "quiet";
  settlementId?: SettlementId;
}

export interface CharterReport {
  revision: number;
  choiceId: CharterChoiceId;
  title: string;
  text: string;
  reaction: string;
  fromDay: number;
  toDay: number;
  news: string[];
}

export interface CharterEnding {
  kind: "shared" | "local" | "costly" | "missed";
  title: string;
  text: string;
  baselineWorkshops: number;
  workshops: number;
}

export interface CharterRun {
  patron: SettlementId;
  deadline: 21;
  revision: number;
  trust: Record<SettlementId, number>;
  helped: Record<SettlementId, number>;
  supplied: Record<SettlementId, number>;
  stolen: number;
  reports: CharterReport[];
  ending: CharterEnding | null;
}

export function representative(id: SettlementId) {
  return id === "willow"
    ? {
        name: "Mara",
        role: "Willow's forewoman",
        quote:
          "The council wants to inspect a roof. Apparently a strongly worded sketch will not do.",
      }
    : {
        name: "Nix",
        role: "Bracken's quartermaster",
        quote:
          "One workshop, three weeks, and a council that counts nails. I can offer you the first two.",
      };
}

export function newCharter(patron: SettlementId): CharterRun {
  return {
    patron,
    deadline: 21,
    revision: 0,
    trust: { willow: 0, bracken: 0 },
    helped: { willow: 0, bracken: 0 },
    supplied: { willow: 0, bracken: 0 },
    stolen: 0,
    reports: [],
    ending: null,
  };
}

export function supplyFor(world: World, id: SettlementId) {
  const group = world.settlements.find((entry) => entry.id === id)!;
  let capacity = 8;
  const amounts = { timber: 0, ore: 0 };
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

function usefulShift(world: World, group: Settlement) {
  if (!canHarvest(world, group)) return false;
  const arrival = structuredClone(group);
  if (arrival.convoy?.travelRemaining === 1) {
    arrival.home[arrival.convoy.resource] += arrival.convoy.amount;
    arrival.home.food += arrival.convoy.provisions;
    arrival.convoy = null;
  }
  const forecast = planFor(
    {
      ...world,
      player: {
        ...world.player,
        assignment: { settlementId: group.id, profile: "novice" },
      },
    },
    arrival,
  ).chosen.action;
  const npcTimber =
    forecast.type === "gather" && forecast.resource === "timber"
      ? forecast.workers
      : 0;
  return (
    Math.min(world.forestTimber, rawOutstanding(arrival, "timber")) > npcTimber
  );
}

export function getCharterChoices(world: World): CharterChoice[] {
  const run = world.charter;
  if (!run || run.ending || world.tick >= run.deadline) return [];
  const neighbor: SettlementId = run.patron === "willow" ? "bracken" : "willow";
  const order =
    run.trust[run.patron] >= 2 && run.trust[neighbor] < 2
      ? [neighbor, run.patron]
      : [run.patron, neighbor];
  const days = Math.min(3, run.deadline - world.tick);
  const work: CharterChoice[] = [];
  const supplies: CharterChoice[] = [];
  const raids: CharterChoice[] = [];
  for (const id of order) {
    const group = world.settlements.find((entry) => entry.id === id)!;
    const shortName = id === "willow" ? "Willow" : "Bracken";
    if (usefulShift(world, group))
      work.push({
        id: `work-${id}`,
        title: `Work with ${shortName}`,
        description: `Cut up to ${days * 2} needed timber alongside ${representative(id).name}'s crew. Productive help earns 1 trust; the village provides your meals.`,
        cost: `${days} days · your time`,
        tone: "help",
        settlementId: id,
      });
    const supply = supplyFor(world, id);
    if (world.player.inventory.food > 0 && supply.timber + supply.ore > 0)
      supplies.push({
        id: `supply-${id}`,
        title: `Supply ${shortName}`,
        description: `Hand over ${supply.timber ? `${supply.timber} timber` : ""}${supply.timber && supply.ore ? " and " : ""}${supply.ore ? `${supply.ore} ore` : ""} from your pack. Then stay to distribute supplies. Earn 1 trust.`,
        cost: `${days} days · 1 ration · the goods`,
        tone: "help",
        settlementId: id,
      });
    const convoy = group.convoy;
    if (
      convoy &&
      !convoy.intercepted &&
      convoy.amount > 0 &&
      world.player.inventory.food > 0 &&
      world.player.lastRaidTick !== world.tick
    )
      raids.push({
        id: `raid-${id}`,
        title: `Intercept ${shortName}'s convoy`,
        description:
          convoy.escorts >= 2
            ? `Two escorts will repel you. The attempt still costs a ration and 1 trust with ${shortName}.`
            : `Take cargo from the ${convoy.amount}-${convoy.resource} shipment. ${convoy.escorts ? "One escort reduces the haul." : "It is unguarded."} ${shortName} loses supplies and 3 trust in you.`,
        cost: `${days} days · 1 ration · their goodwill`,
        tone: "risk",
        settlementId: id,
      });
  }
  const choices: CharterChoice[] = [];
  if (work[0]) choices.push(work[0]);
  // Keep a peaceful way to pass time. Opportunities replace a secondary task,
  // never force the player to raid a community to continue the chapter.
  const opportunity =
    supplies[0] ??
    raids.find((choice) => choice.settlementId === neighbor) ??
    raids[0] ??
    work[1];
  if (opportunity) choices.push(opportunity);
  choices.push({
    id: "wait",
    title: "Hear the next report",
    description:
      "Let the crews carry on. Stop at the next shipment or completed workshop, or after three days. No trust earned.",
    cost: `Up to ${days} days · no supplies`,
    tone: "quiet",
  });
  return choices;
}

export function getCharterSituation(world: World): string {
  const run = world.charter;
  if (!run)
    return "Two villages need workshops. You need someone willing to put their name beside yours.";
  if (run.ending) return run.ending.text;
  const patron = world.settlements.find((group) => group.id === run.patron)!;
  if (patron.workshop.complete && run.trust[run.patron] >= 2)
    return "Your promise is ready for inspection. There is still time to decide what kind of neighbor you want to be.";
  if (run.trust[run.patron] < 2)
    return `${representative(run.patron).name} needs a reason to vouch for you. Each productive shift or useful supply handover earns one trust; you need two.`;
  if (patron.convoy)
    return `${representative(run.patron).name} trusts you. Some supplies are on the road; the crew keeps working while they travel.`;
  if (rawOutstanding(patron, "timber") === 0)
    return "Your sponsor has enough timber committed. The crew is handling ore, deliveries and construction; consider who else could use your time.";
  return "You have your sponsor's trust. The workshop still needs materials before the council arrives.";
}
