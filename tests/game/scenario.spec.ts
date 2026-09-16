import { expect, test } from "@playwright/test";

for (const mode of ["browser", "server"] as const) {
  test(`${mode}: a player improves NPC work and the crews finish after leaving`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      mode === "server" ? "/?view=lab&mode=server" : "/?view=lab",
    );
    await expect(
      page.getByRole("heading", { name: "The Charter", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Starting conditions").selectOption("balanced");
    await page.getByLabel("Replay seed").fill("7");
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await expect(page.getByTestId("world-tick")).toHaveText("Day 0");
    await page.getByRole("button", { name: "Join Willow crew" }).click();
    await page.getByRole("button", { name: "+1 day", exact: true }).click();
    await expect(page.getByTestId("willow-forest")).toHaveText("4");
    await expect(page.getByTestId("bracken-forest")).toHaveText("2");
    await page.getByRole("button", { name: "Leave the crew" }).click();
    await page.getByRole("button", { name: "+1 day", exact: true }).click();
    await expect(page.getByTestId("willow-forest")).toHaveText("4");
    await expect(page.getByTestId("willow-decision")).not.toBeEmpty();
    await page.getByRole("button", { name: "+10 days" }).click();
    await page.getByRole("button", { name: "+10 days" }).click();
    await page.getByRole("button", { name: "+10 days" }).click();
    await expect(
      page
        .getByTestId("settlement-willow")
        .getByText("Workshop built", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("settlement-bracken")
        .getByText("Workshop built", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${mode}: convoy losses lead to funded guards and a visible consequence`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      mode === "server" ? "/?view=lab&mode=server" : "/?view=lab",
    );
    await page.getByLabel("Starting conditions").selectOption("balanced");
    await page.getByLabel("Replay seed").fill("7");
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await page.getByRole("button", { name: "Next shipment" }).click();
    await expect(page.getByTestId("world-tick")).toHaveText("Day 9");
    await expect(page.getByTestId("convoy-willow")).toContainText("0 escorts");
    await page.getByRole("button", { name: "Intercept Willow convoy" }).click();
    await expect(page.getByTestId("player-pack")).toContainText(
      "5 rations · 9 timber",
    );
    await expect(page.getByTestId("settlement-willow")).toContainText(
      "50 / 100",
    );
    await expect(
      page.getByRole("button", { name: "Interception resolved" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "+10 days" }).click();
    await expect(page.getByTestId("convoy-willow")).toContainText("2 escorts");
    await expect(page.getByTestId("willow-workers")).toContainText("3 travel");
    await page.getByRole("button", { name: "Intercept Willow convoy" }).click();
    await expect(page.getByTestId("player-pack")).toContainText(
      "4 rations · 9 timber",
    );
    await expect(
      page.getByRole("region", { name: "World chronicle" }),
    ).toContainText("repelled");
    await page
      .getByTestId("settlement-willow")
      .getByText("Compare available choices")
      .click();
    await expect(
      page
        .getByTestId("settlement-willow")
        .getByText("The caravan is already on the road.")
        .first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${mode}: testers can compare food and labor constraints`, async ({
    page,
  }) => {
    await page.goto(
      mode === "server" ? "/?view=lab&mode=server" : "/?view=lab",
    );
    await page.getByLabel("Starting conditions").selectOption("food-shortage");
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await expect(page.getByTestId("willow-food")).toHaveText("0");
    await expect(page.getByTestId("willow-workers")).toContainText(
      "3 forage · 1 produce",
    );
    await page.getByRole("button", { name: "+1 day", exact: true }).click();
    await expect(page.getByTestId("willow-food")).toHaveText("8");
    await page.getByLabel("Starting conditions").selectOption("small-crew");
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await expect(page.getByTestId("willow-workers")).toContainText("2 NPCs");
    await page.getByLabel("Replay seed").fill("-1");
    await expect(
      page.getByRole("button", { name: "Reset scenario" }),
    ).toBeDisabled();
  });
}

test("browser scenarios stay isolated between tabs", async ({
  page,
  context,
}) => {
  await page.goto("/?view=lab");
  await page.getByRole("button", { name: "+10 days" }).click();
  const other = await context.newPage();
  await other.goto("/?view=lab");
  await expect(other.getByTestId("world-tick")).toHaveText("Day 0");
  await expect(page.getByTestId("world-tick")).toHaveText("Day 10");
});
