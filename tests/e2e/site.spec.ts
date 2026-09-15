import { test, expect } from "@playwright/test";
test("home and navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "confidence",
  );
  const aboutLink = page.getByRole("link", { name: "About", exact: true });
  if (!(await aboutLink.isVisible())) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await aboutLink.click();
  await expect(page).toHaveURL(/about/);
});
test("contact email and policies", async ({ page }) => {
  await page.goto("/contact/");
  await expect(
    page.getByText("contact@fusaakigames.com").first(),
  ).toBeVisible();
  for (const path of ["shipping", "returns", "privacy", "terms"]) {
    await page.goto(`/${path}/`);
    await expect(
      page.getByText("Starter template", { exact: false }),
    ).toBeVisible();
  }
});
test("mobile menu toggles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("packaged game loads under the deployment subpath", async ({ page }) => {
  test.skip(!process.env.TEST_RELEASE_BUNDLE, "Requires pnpm release:bundle.");
  await page.goto("/FusaakiGamesLLC/play/");
  await expect(
    page.getByRole("heading", { name: "The Charter", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "+1 day", exact: true }).click();
  await expect(page.getByTestId("world-tick")).toHaveText("Day 1");
});
