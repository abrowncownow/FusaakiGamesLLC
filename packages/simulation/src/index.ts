export * from "./model.js";
export * from "./planner.js";
export * from "./engine.js";
export * from "./charter.js";
export * from "./journey.js";
import { createWorld, applyCommand, isCommand } from "./engine.js";
import type { World, Command } from "./model.js";
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
