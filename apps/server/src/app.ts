import Fastify from "fastify";
import {
  CommandError,
  createScenarioService,
  isCommand,
  WORLD_VERSION,
} from "@fusaakigames/simulation";

export function buildApp() {
  const app = Fastify({
    bodyLimit: 4096,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  });
  const scenario = createScenarioService();
  app.get("/api/health", async () => ({
    status: "ok",
    worldVersion: WORLD_VERSION,
    persistence: "memory",
    mode: "development",
  }));
  app.get("/api/world", async () => scenario.snapshot());
  app.post<{ Body: { id: string; command: unknown } }>(
    "/api/commands",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["id", "command"],
          properties: {
            id: { type: "string", pattern: "^[a-zA-Z0-9-]{1,80}$" },
            command: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      // Local development endpoint: a hosted world will require authenticated principals.
      const origin = request.headers.origin;
      if (
        origin &&
        !["http://127.0.0.1:5173", "http://127.0.0.1:4173"].includes(origin)
      )
        return reply.code(403).send({ error: "Origin is not permitted." });
      if (!isCommand(request.body.command))
        return reply.code(400).send({ error: "Invalid scenario command." });
      try {
        return scenario.execute(request.body.id, request.body.command);
      } catch (error) {
        if (error instanceof CommandError)
          return reply.code(error.statusCode).send({ error: error.message });
        throw error;
      }
    },
  );
  return app;
}
