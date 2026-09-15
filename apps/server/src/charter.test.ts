import { describe, expect, it } from "vitest";
import type { Command, World } from "@fusaakigames/simulation";
import { buildApp } from "./app.js";

describe("guided charter API", () => {
  it("applies concurrent retries to one complete shift and conflicts on a second choice at that revision", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const initial = (await app.inject("/api/world")).json<World>();
      const startedResponse = await post("begin", {
        type: "start-charter",
        patron: "willow",
        runId: initial.runId,
      });
      expect(startedResponse.statusCode).toBe(200);
      const started = startedResponse.json<World>();
      const command: Command = {
        type: "charter-choice",
        choice: "work-willow",
        runId: started.runId,
        revision: started.charter!.revision,
      };
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => post("same-shift", command)),
      );
      const expected = responses[0]!.json<World>();
      for (const response of responses) {
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(expected);
      }
      expect(expected.charter!.revision).toBe(started.charter!.revision + 1);
      expect(expected.charter!.trust.willow).toBe(
        started.charter!.trust.willow + 1,
      );
      expect(expected.player.assignment).toBeNull();
      const stale = await post("different-shift", command);
      expect(stale.statusCode).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(expected);
    } finally {
      await app.close();
    }
  });

  it("serializes competing choices, validates their payloads, and rejects an old run after reset", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const initial = (await app.inject("/api/world")).json<World>();
      const started = (
        await post("begin", {
          type: "start-charter",
          patron: "willow",
          runId: initial.runId,
        })
      ).json<World>();
      const base = {
        type: "charter-choice",
        runId: started.runId,
        revision: started.charter!.revision,
        choice: "work-willow",
      };
      const competing = await Promise.all([
        post("first-tab", base),
        post("second-tab", { ...base, choice: "wait" }),
      ]);
      expect(competing.map((response) => response.statusCode).sort()).toEqual([
        200, 409,
      ]);
      const current = (await app.inject("/api/world")).json<World>();
      expect(current.charter!.revision).toBe(started.charter!.revision + 1);
      for (const command of [
        { ...base, reward: 100 },
        { ...base, choice: "free-tools" },
        { ...base, revision: "0" },
        { ...base, runId: -1 },
        { ...base, choice: ["wait"] },
      ]) {
        expect((await post("malformed", command)).statusCode).toBe(400);
      }
      expect(
        (await post("clock-bypass", { type: "advance", steps: 1 })).statusCode,
      ).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(current);
      const reset = (await post("reset", { type: "reset" })).json<World>();
      expect(reset.runId).toBeGreaterThan(current.runId);
      expect(
        (
          await post("stale-start", {
            type: "start-charter",
            patron: "willow",
            runId: started.runId,
          })
        ).statusCode,
      ).toBe(409);
      expect((await post("stale-action", base)).statusCode).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(reset);
    } finally {
      await app.close();
    }
  });
});
