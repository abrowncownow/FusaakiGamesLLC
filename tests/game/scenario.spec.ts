import { expect, test } from "@playwright/test";

for (const mode of ["browser", "server"] as const) {
  test(`${mode}: a player improves NPC work and the crews finish after leaving`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(mode === "server" ? "/?mode=server" : "/");
    await expect(
      page.getByRole("heading", { name: "The Charter", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await expect(page.getByTestId("world-tick")).toHaveText("Day 0");
    await page.getByRole("button", { name: "Join Willow crew" }).click();
    await page.getByRole("button", { name: "+1 day", exact: true }).click();
    await expect(page.getByTestId("willow-forest")).toHaveText("4");
    await expect(page.getByTestId("bracken-forest")).toHaveText("2");
    await page.getByRole("button", { name: "Leave the crew" }).click();
    await page.getByRole("button", { name: "+1 day", exact: true }).click();
    await expect(page.getByTestId("willow-forest")).toHaveText("6");
    await page.getByRole("button", { name: "+10 days" }).click();
    await page.getByRole("button", { name: "+10 days" }).click();
    await expect(
      page
        .getByTestId("settlement-willow")
        .getByText("complete", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("settlement-bracken")
        .getByText("complete", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("browser scenarios stay isolated between tabs", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+10 days" }).click();
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.getByTestId("world-tick")).toHaveText("Day 0");
  await expect(page.getByTestId("world-tick")).toHaveText("Day 10");
});
