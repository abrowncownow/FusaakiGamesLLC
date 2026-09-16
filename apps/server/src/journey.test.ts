import { describe, expect, it } from "vitest";
import type { World } from "@fusaakigames/simulation";
import { buildApp } from "./app.js";

describe("exploration API", () => {
  it("commits concurrent retries to one gathered load and one NPC day", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const started = (
        await post("start", { type: "start-journey", runId: 0 })
      ).json<World>();
      const command = {
        type: "journey-action",
        runId: started.runId,
        revision: started.journey!.revision,
        action: "gather-timber",
      };
      const retries = await Promise.all(
        Array.from({ length: 5 }, () => post("same-load", command)),
      );
      const expected = retries[0]!.json<World>();
      for (const response of retries) {
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(expected);
      }
      expect(expected.tick).toBe(1);
      expect(expected.journey!.revision).toBe(1);
      expect(expected.player.inventory.timber).toBe(4);
      expect(expected.settlements.some((group) => group.field.timber > 0)).toBe(
        true,
      );
      expect((await post("stale-load", command)).statusCode).toBe(409);
      expect(
        (await post("same-load", { ...command, action: "rest" })).statusCode,
      ).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(expected);
    } finally {
      await app.close();
    }
  });

  it("rejects teleporting, remote work and invented rewards without changing the world", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const started = (
        await post("start", { type: "start-journey", runId: 0 })
      ).json<World>();
      const base = {
        type: "journey-action",
        runId: started.runId,
        revision: 0,
        action: "gather-timber",
      };
      for (const action of [
        "travel-ruins",
        "gather-ore",
        "deliver-willow",
        "build-bracken",
        "discover-ruins",
      ]) {
        expect(
          (await post(`remote-${action}`, { ...base, action })).statusCode,
        ).toBe(409);
      }
      for (const command of [
        { ...base, reward: 999 },
        { ...base, action: "free-tools" },
        { ...base, revision: "0" },
        { ...base, runId: -1 },
        { type: "start-journey", runId: started.runId, location: "ruins" },
      ])
        expect((await post("invalid", command)).statusCode).toBe(400);
      expect(
        (await post("clock-bypass", { type: "advance", steps: 30 })).statusCode,
      ).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(started);
      const moved = (
        await post("walk", { ...base, action: "travel-mine" })
      ).json<World>();
      expect(moved.journey!.location).toBe("mine");
      expect(
        (
          await post("timber-from-mine", {
            ...base,
            revision: moved.journey!.revision,
          })
        ).statusCode,
      ).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(moved);
    } finally {
      await app.close();
    }
  });

  it("serializes different tabs and rejects actions from a previous expedition", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const started = (
        await post("start", { type: "start-journey", runId: 0 })
      ).json<World>();
      const base = {
        type: "journey-action",
        runId: started.runId,
        revision: 0,
        action: "gather-timber",
      };
      const responses = await Promise.all([
        post("first-tab", base),
        post("second-tab", { ...base, action: "travel-mine" }),
      ]);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([
        200, 409,
      ]);
      const current = (await app.inject("/api/world")).json<World>();
      expect(current.tick).toBe(1);
      expect(current.journey!.revision).toBe(1);
      expect(current).toEqual(
        responses.find((response) => response.statusCode === 200)!.json(),
      );
      const restarted = (
        await post("restart", { type: "start-journey", runId: current.runId })
      ).json<World>();
      expect(restarted.runId).toBe(current.runId + 1);
      expect(
        (
          await post("old-expedition", {
            ...base,
            revision: current.journey!.revision,
            action: "rest",
          })
        ).statusCode,
      ).toBe(409);
      expect(
        (
          await post("old-start", {
            type: "start-journey",
            runId: current.runId,
          })
        ).statusCode,
      ).toBe(409);
      expect((await app.inject("/api/world")).json()).toEqual(restarted);
    } finally {
      await app.close();
    }
  });
});
