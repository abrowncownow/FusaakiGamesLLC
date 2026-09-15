import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function pick(page: Page, id: string) {
  const before = await page.getByTestId("charter-day").innerText();
  await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("charter-day")).not.toHaveText(before);
  await expect(
    page
      .locator('[aria-label="Latest report"], [data-testid="charter-ending"]')
      .first(),
  ).toBeVisible();
}

async function complete(page: Page, preferences: string[]) {
  for (let decision = 0; decision < 25; decision++) {
    if (await page.getByTestId("charter-ending").isVisible()) return;
    const choices = page.getByRole("region", { name: "Your next move" });
    const buttons = choices.locator('[data-testid^="choice-"]');
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    let chosen: string | undefined;
    for (const id of preferences) {
      if (await page.getByTestId(`choice-${id}`).isVisible()) {
        chosen = id;
        break;
      }
    }
    expect(
      chosen,
      "The play route should always offer a usable next action",
    ).toBeDefined();
    await pick(page, chosen!);
  }
  throw new Error("The charter did not reach an ending within 25 decisions.");
}

for (const mode of ["browser", "server"] as const) {
  test(`${mode}: a clear pledge and useful work reach a visible ending`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // The API-backed tests share a local world with the lab suite, so reset it
    // through the supported API before visiting the player-facing entry point.
    if (mode === "server") {
      const response = await page.request.post(
        "http://127.0.0.1:4310/api/commands",
        {
          data: { id: `test-reset-${Date.now()}`, command: { type: "reset" } },
        },
      );
      expect(response.ok()).toBe(true);
    }
    await page.goto(mode === "server" ? "/?mode=server" : "/");
    await expect(
      page.getByRole("button", { name: "Promise Willow", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Promise Willow", exact: true })
      .click();
    await expect(page.getByTestId("charter-day")).toHaveText("Day 0");
    await pick(page, "work-willow");
    await expect(
      page.getByRole("region", { name: "Latest report" }),
    ).toContainText(/timber|harvest/i);
    await complete(page, ["work-willow", "wait"]);
    await expect(page.getByTestId("charter-ending")).toBeVisible();
    await expect(page.getByTestId("charter-ending")).toContainText(/workshop/i);
    await expect(page.getByTestId("choice-work-willow")).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${mode}: waiting reveals an actual convoy choice and its consequence`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (mode === "server") {
      const response = await page.request.post(
        "http://127.0.0.1:4310/api/commands",
        {
          data: {
            id: `test-raid-reset-${Date.now()}`,
            command: { type: "reset" },
          },
        },
      );
      expect(response.ok()).toBe(true);
    }
    await page.goto(mode === "server" ? "/?mode=server" : "/");
    await page
      .getByRole("button", { name: "Promise Bracken", exact: true })
      .click();
    let raided = false;
    for (let decision = 0; decision < 12; decision++) {
      const raids = page.locator('[data-testid^="choice-raid-"]');
      if (await raids.count()) {
        const id = (await raids.first().getAttribute("data-testid"))!.replace(
          "choice-",
          "",
        );
        await pick(page, id);
        raided = true;
        break;
      }
      await pick(page, "wait");
    }
    expect(
      raided,
      "A real moving shipment should offer a player decision",
    ).toBe(true);
    await expect(
      page.getByRole("region", { name: "Latest report" }),
    ).toContainText(/timber|cargo|stole|intercept/i);
    await complete(page, ["supply-bracken", "work-bracken", "wait"]);
    await expect(page.getByTestId("charter-ending")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("a stale server tab refreshes the report without executing its old choice", async ({
  page,
}) => {
  const post = async (id: string, command: object) =>
    page.request.post("http://127.0.0.1:4310/api/commands", {
      data: { id, command },
    });
  await post(`reset-stale-${Date.now()}`, { type: "reset" });
  await page.goto("/?mode=server");
  await page
    .getByRole("button", { name: "Promise Willow", exact: true })
    .click();
  await expect(page.getByTestId("charter-day")).toHaveText("Day 0");
  const world = await (
    await page.request.get("http://127.0.0.1:4310/api/world")
  ).json();
  const other = await post(`other-tab-${Date.now()}`, {
    type: "charter-choice",
    runId: world.runId,
    revision: world.charter.revision,
    choice: "work-bracken",
  });
  expect(other.ok()).toBe(true);
  await page.getByTestId("choice-work-willow").click();
  await expect(page.getByRole("alert")).toContainText("out of date");
  await expect(page.getByTestId("charter-day")).toHaveText("Day 3");
  await expect(
    page.getByRole("region", { name: "Latest report" }),
  ).toContainText("Bracken");
  const after = await (
    await page.request.get("http://127.0.0.1:4310/api/world")
  ).json();
  expect(after.charter.revision).toBe(world.charter.revision + 1);
  expect(after.charter.helped.willow).toBe(0);
});
