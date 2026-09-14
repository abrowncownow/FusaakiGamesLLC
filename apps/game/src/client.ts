import { createScenarioService } from "@fusaakigames/simulation";
import type { Command, World } from "@fusaakigames/simulation";

export function createClient(server: boolean) {
  const local = createScenarioService();
  async function request(path: string, body?: unknown): Promise<World> {
    const response = await fetch(
      `/api/${path}`,
      body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : `World API returned ${response.status}.`,
      );
    }
    return response.json() as Promise<World>;
  }
  return {
    read: async () => (server ? request("world") : local.snapshot()),
    send: async (command: Command) => {
      const id = crypto.randomUUID();
      return server
        ? request("commands", { id, command })
        : local.execute(id, command);
    },
  };
}
