import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("world command API", () => {
  it("validates commands and applies concurrent retries only once", async () => {
    const app = buildApp();
    try {
      const payload = {
        id: "same-order",
        command: { type: "advance", steps: 3 },
      };
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          app.inject({ method: "POST", url: "/api/commands", payload }),
        ),
      );
      expect(
        responses.every(
          (response) =>
            response.statusCode === 200 && response.json().tick === 3,
        ),
      ).toBe(true);
      expect((await app.inject("/api/world")).json().tick).toBe(3);
      const conflict = await app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { ...payload, command: { type: "advance", steps: 4 } },
      });
      expect(conflict.statusCode).toBe(409);
      for (const command of [
        { type: "advance", steps: 1e6 },
        { type: "advance", steps: "3" },
        { type: "reset", stock: 100 },
        { type: "join", settlementId: "willow", profile: "admin" },
      ]) {
        const result = await app.inject({
          method: "POST",
          url: "/api/commands",
          payload: { id: "invalid", command },
        });
        expect(result.statusCode).toBe(400);
      }
      expect((await app.inject("/api/world")).json().tick).toBe(3);
    } finally {
      await app.close();
    }
  });

  it("reports ephemeral storage and rejects foreign browser origins", async () => {
    const app = buildApp();
    try {
      expect((await app.inject("/api/health")).json()).toMatchObject({
        status: "ok",
        persistence: "memory",
      });
      const result = await app.inject({
        method: "POST",
        url: "/api/commands",
        headers: { origin: "https://example.com" },
        payload: { id: "cross-site", command: { type: "reset" } },
      });
      expect(result.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("applies convoy loot once across concurrent retries and rejects a stale target", async () => {
    const app = buildApp();
    const post = (id: string, command: object) =>
      app.inject({
        method: "POST",
        url: "/api/commands",
        payload: { id, command },
      });
    try {
      const before = (await post("next", { type: "next-convoy" })).json();
      const command = {
        type: "intercept",
        settlementId: "willow",
        convoyId: before.settlements[0].convoy.id,
      };
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => post("raid", command)),
      );
      for (const response of responses) {
        expect(response.statusCode).toBe(200);
        expect(response.json().player.inventory).toMatchObject({
          food: 5,
          timber: 9,
        });
        expect(response.json().settlements[0].convoy.amount).toBe(3);
      }
      expect((await post("raid-again", command)).statusCode).toBe(409);
      await post("advance", { type: "advance", steps: 10 });
      const snapshot = (await app.inject("/api/world")).json();
      expect((await post("stale", command)).statusCode).toBe(409);
      expect(
        (await post("bad-target", { ...command, convoyId: [] })).statusCode,
      ).toBe(400);
      expect((await app.inject("/api/world")).json()).toEqual(snapshot);
    } finally {
      await app.close();
    }
  });
});
