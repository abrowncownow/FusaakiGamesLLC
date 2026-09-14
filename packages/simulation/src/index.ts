export const WORLD_VERSION = 1;
export const TIMBER_REQUIRED = 24;
export type SettlementId = "willow" | "bracken";
export type Profile = "novice" | "skilled";
export type Stage = "harvesting" | "transporting" | "building" | "complete";

export interface Settlement {
  id: SettlementId;
  name: string;
  workers: number;
  stage: Stage;
  timberAtForest: number;
  cargo: number;
  timberAtHome: number;
  timberUsed: number;
  travelRemaining: number;
  buildWork: number;
}

export interface World {
  version: typeof WORLD_VERSION;
  tick: number;
  forestTimber: number;
  settlements: Settlement[];
  player: { settlementId: SettlementId; profile: Profile } | null;
  events: { tick: number; text: string }[];
}

export type Command =
  | { type: "advance"; steps: number }
  | { type: "join"; settlementId: SettlementId; profile: Profile }
  | { type: "leave" }
  | { type: "reset" };

export function createWorld(): World {
  return {
    version: WORLD_VERSION,
    tick: 0,
    forestTimber: 96,
    player: null,
    settlements: [
      { id: "willow", name: "Willow village", workers: 2 },
      { id: "bracken", name: "Bracken camp", workers: 2 },
    ].map((group) => ({
      ...group,
      id: group.id as SettlementId,
      stage: "harvesting",
      timberAtForest: 0,
      cargo: 0,
      timberAtHome: 0,
      timberUsed: 0,
      travelRemaining: 0,
      buildWork: 0,
    })),
    events: [
      {
        tick: 0,
        text: "Both communities assigned NPC crews to gather 24 timber for a workshop.",
      },
    ],
  };
}

function record(world: World, text: string) {
  world.events.push({ tick: world.tick, text });
  world.events = world.events.slice(-40);
}

export function reasonFor(group: Settlement): string {
  switch (group.stage) {
    case "harvesting":
      return "Gathering timber for a workshop.";
    case "transporting":
      return "Carrying the workshop timber home.";
    case "building":
      return "Using delivered timber to assemble the workshop.";
    case "complete":
      return "Workshop finished. This foundation scenario is complete.";
  }
}

export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const command = value as Record<string, unknown>;
  const keys = Object.keys(command).sort().join(",");
  if (command.type === "advance") {
    return (
      keys === "steps,type" &&
      Number.isInteger(command.steps) &&
      (command.steps as number) >= 1 &&
      (command.steps as number) <= 30
    );
  }
  if (command.type === "join") {
    return (
      keys === "profile,settlementId,type" &&
      ["willow", "bracken"].includes(String(command.settlementId)) &&
      ["novice", "skilled"].includes(String(command.profile))
    );
  }
  return (
    keys === "type" && (command.type === "leave" || command.type === "reset")
  );
}

export function applyCommand(current: World, command: Command): World {
  if (!isCommand(command)) throw new Error("Invalid scenario command.");
  if (command.type === "reset") return createWorld();
  const world = structuredClone(current);
  if (command.type === "join") {
    const group = world.settlements.find(
      (entry) => entry.id === command.settlementId,
    );
    if (!group || group.stage !== "harvesting")
      throw new Error("This crew has finished harvesting.");
    world.player = {
      settlementId: command.settlementId,
      profile: command.profile,
    };
    record(
      world,
      `You joined ${group.name}'s timber crew as a ${command.profile === "skilled" ? "skilled" : "new"} harvester.`,
    );
    return world;
  }
  if (command.type === "leave") {
    if (world.player)
      record(world, "You left the crew. NPC workers continue the requisition.");
    world.player = null;
    return world;
  }
  for (let step = 0; step < command.steps; step++) {
    world.tick += 1;
    for (const group of world.settlements) {
      switch (group.stage) {
        case "harvesting": {
          const bonus =
            world.player?.settlementId === group.id
              ? world.player.profile === "skilled"
                ? 4
                : 2
              : 0;
          const gathered = Math.min(
            group.workers + bonus,
            TIMBER_REQUIRED - group.timberAtForest,
            world.forestTimber,
          );
          group.timberAtForest += gathered;
          world.forestTimber -= gathered;
          if (group.timberAtForest === TIMBER_REQUIRED) {
            group.cargo = group.timberAtForest;
            group.timberAtForest = 0;
            group.travelRemaining = 3;
            group.stage = "transporting";
            if (world.player?.settlementId === group.id) world.player = null;
            record(
              world,
              `${group.name}'s convoy departed with ${group.cargo} timber. Harvesting is complete.`,
            );
          }
          break;
        }
        case "transporting":
          group.travelRemaining -= 1;
          if (group.travelRemaining === 0) {
            group.timberAtHome += group.cargo;
            group.cargo = 0;
            group.stage = "building";
            record(
              world,
              `${group.name}'s timber arrived. Its crew can now build the workshop.`,
            );
          }
          break;
        case "building":
          group.buildWork += group.workers;
          if (group.buildWork >= 4) {
            group.timberAtHome -= TIMBER_REQUIRED;
            group.timberUsed += TIMBER_REQUIRED;
            group.stage = "complete";
            record(
              world,
              `${group.name} completed its workshop using ${TIMBER_REQUIRED} timber.`,
            );
          }
          break;
        case "complete":
          break;
      }
    }
  }
  return world;
}

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

/** In-memory development adapter. Persistent receipts and transactions belong in PostgreSQL. */
export function createScenarioService() {
  let world = createWorld();
  const receipts = new Map<string, { command: string; result: World }>();
  return {
    snapshot: () => structuredClone(world),
    execute(id: string, command: Command): World {
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(id) || !isCommand(command))
        throw new CommandError("Invalid command or command ID.", 400);
      const fingerprint = JSON.stringify(
        Object.entries(command).sort(([a], [b]) => a.localeCompare(b)),
      );
      const previous = receipts.get(id);
      if (previous) {
        if (previous.command !== fingerprint)
          throw new CommandError(
            "This command ID already belongs to a different action.",
            409,
          );
        return structuredClone(previous.result);
      }
      if (receipts.size >= 2000)
        throw new CommandError(
          "Development command limit reached. Restart the sandbox.",
          429,
        );
      let next: World;
      try {
        next = applyCommand(world, command);
      } catch (error) {
        throw new CommandError(
          error instanceof Error ? error.message : "Command rejected.",
          409,
        );
      }
      world = next;
      receipts.set(id, { command: fingerprint, result: structuredClone(next) });
      return structuredClone(next);
    },
  };
}
