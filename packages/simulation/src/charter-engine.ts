import type { Command, SettlementId, World } from "./model.js";
import { committedRaw } from "./planner.js";
import {
  getCharterChoices,
  representative,
  supplyFor,
  type CharterEnding,
} from "./charter.js";

interface EngineEffects {
  step(world: World): void;
  createWorld(): World;
  intercept(
    world: World,
    command: Extract<Command, { type: "intercept" }>,
  ): void;
}

function standing(world: World, id: SettlementId, delta: number) {
  const trust = world.charter!.trust;
  const before = trust[id];
  trust[id] = Math.max(-5, Math.min(5, trust[id] + delta));
  return trust[id] - before;
}

function finish(world: World, effects: EngineEffects): CharterEnding {
  const run = world.charter!;
  const patron = world.settlements.find((group) => group.id === run.patron)!;
  const neighbor = world.settlements.find((group) => group.id !== run.patron)!;
  const kept = patron.workshop.complete && run.trust[patron.id] >= 2;
  const shared =
    kept && neighbor.workshop.complete && run.trust[neighbor.id] >= 2;
  const costly =
    kept && (run.trust[neighbor.id] < 0 || neighbor.threatFromPlayer > 0);
  const baseline = effects.createWorld();
  while (baseline.tick < run.deadline) effects.step(baseline);
  return {
    kind: shared ? "shared" : costly ? "costly" : kept ? "local" : "missed",
    title: shared
      ? "Two signatures. One beginning."
      : costly
        ? "A charter, and a grudge."
        : kept
          ? "Your name on the charter."
          : "The unsigned charter.",
    text: shared
      ? "Both workshops are ready and both communities will vouch for you. The council grants your guild a shared charter. Nix asks who gets to keep the pen."
      : costly
        ? `${representative(patron.id).name} signs: the workshop is ready and your promise is kept. ${representative(neighbor.id).name} remembers the missing cargo. You have a foothold, and a neighbor to make peace with.`
        : kept
          ? `${representative(patron.id).name} vouches for you beside a finished workshop. The council grants your guild its first charter. Your standing with the other village is still yours to shape.`
          : !patron.workshop.complete
            ? `The inspection arrives before ${patron.name}'s workshop is ready. The council leaves your charter unsigned. The crews will keep building; your promise needed a different use of those three weeks.`
            : `${patron.name}'s workshop is ready, but ${representative(patron.id).name} cannot vouch for you. A finished roof and two trust were both part of the promise.`,
    workshops: world.settlements.filter((group) => group.workshop.complete)
      .length,
    baselineWorkshops: baseline.settlements.filter(
      (group) => group.workshop.complete,
    ).length,
  };
}

export function executeCharterChoice(
  world: World,
  command: Extract<Command, { type: "charter-choice" }>,
  effects: EngineEffects,
) {
  const run = world.charter;
  if (
    !run ||
    command.runId !== world.runId ||
    command.revision !== run.revision
  )
    throw new Error(
      "This decision is out of date. Refresh the world before choosing again.",
    );
  if (run.ending)
    throw new Error(
      "This charter run has ended. Start a new attempt to play again.",
    );
  const choice = getCharterChoices(world).find(
    (entry) => entry.id === command.choice,
  );
  if (!choice)
    throw new Error(
      "That opportunity is no longer available. Choose from the current report.",
    );
  const fromDay = world.tick;
  const openingMaterials = world.settlements.map((group) => ({
    timber: committedRaw(group, "timber") + group.used.timber,
    ore: committedRaw(group, "ore") + group.used.ore,
  }));
  const target = choice.settlementId;
  const speaker = representative(target ?? run.patron);
  const startContribution = target ? run.helped[target] : 0;
  let title = "News from the valley.";
  let text =
    "The crews carried on with their own work. You earned no additional trust.";
  let reaction = `${speaker.name}: “The minutes are very thorough. I would prefer the workshop.”`;
  if (choice.id.startsWith("work-") && target) {
    world.player.assignment = { settlementId: target, profile: "novice" };
  } else if (choice.id.startsWith("raid-") && target) {
    const group = world.settlements.find((entry) => entry.id === target)!;
    const resource = group.convoy!.resource;
    const before = world.player.inventory[resource];
    effects.intercept(world, {
      type: "intercept",
      settlementId: target,
      convoyId: group.convoy!.id,
    });
    const stolen = world.player.inventory[resource] - before;
    run.stolen += stolen;
    const lostTrust = -standing(world, target, stolen ? -3 : -1);
    title = stolen
      ? "Cargo taken. A neighbor made wary."
      : "The guards hold the road.";
    text = stolen
      ? `${stolen} ${resource} moved into your pack. You spent a ration and lost ${lostTrust} trust with ${group.name}; their missing supplies must be replaced.`
      : `The escorts kept every unit of cargo. You spent a ration and lost ${lostTrust} trust with ${group.name}.`;
    reaction = `${speaker.name}: “Those supplies had a destination. And I have a very good memory.”`;
  } else if (choice.id.startsWith("supply-") && target) {
    const group = world.settlements.find((entry) => entry.id === target)!;
    const amounts = supplyFor(world, target);
    for (const resource of ["timber", "ore"] as const) {
      world.player.inventory[resource] -= amounts[resource];
      group.home[resource] += amounts[resource];
    }
    world.player.inventory.food--;
    world.ledger.foodConsumed++;
    run.supplied[target] += amounts.timber + amounts.ore;
    const earned = standing(world, target, 1);
    title = "Goods on the doorstep.";
    text = `You handed ${amounts.timber} timber and ${amounts.ore} ore from your pack to ${group.name}, then stayed to distribute them. One ration spent; ${earned ? "1 trust earned" : "your trust is already at its maximum"}.`;
    reaction = `${speaker.name}: “Actual supplies. I had almost forgotten what those looked like.”`;
  }

  const limit = Math.min(3, run.deadline - world.tick);
  for (let i = 0; i < limit; i++) {
    const milestone = world.settlements
      .map(
        (group) => `${group.convoy?.id ?? "home"}:${group.workshop.complete}`,
      )
      .join("|");
    effects.step(world);
    if (
      choice.id === "wait" &&
      milestone !==
        world.settlements
          .map(
            (group) =>
              `${group.convoy?.id ?? "home"}:${group.workshop.complete}`,
          )
          .join("|")
    )
      break;
  }
  world.player.assignment = null;
  const developments = world.events.filter(
    (event) =>
      event.tick > fromDay &&
      (event.kind === "shipment" || event.kind === "project"),
  );
  if (choice.id === "wait") {
    const patron = world.settlements.find((group) => group.id === run.patron)!;
    const milestone =
      developments.find(
        (event) => event.kind === "project" && event.text.includes(patron.name),
      ) ??
      developments.find((event) => event.kind === "project") ??
      developments.at(-1);
    if (milestone) {
      title =
        milestone.kind === "project"
          ? "Something to show the council."
          : "Word from the road.";
      text = milestone.text;
    } else {
      const totals = world.settlements.reduce(
        (sum, group, index) => ({
          timber:
            sum.timber +
            committedRaw(group, "timber") +
            group.used.timber -
            openingMaterials[index]!.timber,
          ore:
            sum.ore +
            committedRaw(group, "ore") +
            group.used.ore -
            openingMaterials[index]!.ore,
        }),
        { timber: 0, ore: 0 },
      );
      title = "The crews keep their own hours.";
      text = `Between them, the communities gathered ${totals.timber} timber and ${totals.ore} ore. Their food, deliveries and construction stayed in NPC hands while you waited.`;
    }
    reaction = patron.workshop.complete
      ? `${speaker.name}: “A roof. A door. This is beginning to look dangerously official.”`
      : `${speaker.name}: “The council can debate the minutes. We will keep working on the days.”`;
  }
  if (choice.id.startsWith("work-") && target) {
    const produced = run.helped[target] - startContribution;
    const earned = produced > 0 ? standing(world, target, 1) : 0;
    title = produced
      ? `${produced} timber. A promise taking shape.`
      : "The crew finished ahead of you.";
    text = produced
      ? `You cut ${produced} timber for ${target === "willow" ? "Willow" : "Bracken"}'s order. The village provided your meals. ${earned ? "You earned 1 trust." : "Your trust is already at its maximum."} The crew handled its other work.`
      : "The available timber order was filled before your contribution. No extra materials or trust were created.";
    reaction = `${speaker.name}: ${produced ? (target === "willow" ? "“Good timber. Finally, a proposal with some weight.”" : "“I have filed you under ‘useful’, just above ‘wheelbarrow’.”") : "“A rare case of the work getting ahead of the paperwork.”"}`;
  }
  run.revision++;
  run.reports.push({
    revision: run.revision,
    choiceId: choice.id,
    title,
    text,
    reaction,
    fromDay,
    toDay: world.tick,
    news: developments.slice(-3).map((event) => event.text),
  });
  if (world.tick >= run.deadline) run.ending = finish(world, effects);
}
