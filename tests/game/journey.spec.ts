import { expect, test, type Page } from "@playwright/test";

const api = "http://127.0.0.1:4310/api";

async function enter(page: Page, mode: "browser" | "server") {
  if (mode === "server") {
    const response = await page.request.post(`${api}/commands`, {
      data: { id: `journey-reset-${Date.now()}`, command: { type: "reset" } },
    });
    expect(response.ok()).toBe(true);
  }
  await page.goto(mode === "server" ? "/?mode=server" : "/");
  await page.getByRole("button", { name: "Enter the valley" }).click();
  await expect(page.getByTestId("journey-day")).toHaveText("Day 0");
  await expect(page.getByTestId("journey-gather-timber")).toBeEnabled();
}

async function act(page: Page, id: string, day: number) {
  await page.getByTestId(`journey-${id}`).click();
  await expect(page.getByTestId("journey-day")).toHaveText(`Day ${day}`);
  await expect(page.getByTestId("journey-rest")).toBeEnabled();
}

async function walk(page: Page, place: string, id: string, day: number) {
  await page
    .getByRole("button", { name: `Look at ${place}`, exact: true })
    .click();
  await act(page, `travel-${id}`, day);
  await expect(page.getByTestId("journey-location")).toHaveText(place);
}

for (const mode of ["browser", "server"] as const) {
  test(`${mode}: explore, carry timber, and leave supplies at a real village`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await enter(page, mode);
    await act(page, "gather-timber", 1);
    await expect(page.getByTestId("pack-timber")).toHaveText("4");
    await page
      .getByRole("button", { name: /^Willow,.*Inspect place$/ })
      .click();
    await expect(page.getByTestId("journey-location")).toHaveText(
      "Willow village",
    );
    await expect(page.getByTestId("journey-day")).toHaveText("Day 1");
    await expect(page.getByTestId("journey-deliver-willow")).not.toBeVisible();
    await act(page, "travel-willow", 2);
    await expect(page.getByTestId("pack-timber")).toHaveText("4");
    await act(page, "deliver-willow", 3);
    await expect(page.getByTestId("pack-timber")).toHaveText("0");
    await expect(
      page.getByRole("region", { name: "Selected place" }),
    ).toContainText("Your contribution: 4 materials delivered.");
    await expect(
      page.getByRole("region", { name: "What happened" }),
    ).toContainText("Mara");
    await expect(page.getByTestId("journey-deliver-willow")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Willow, you are here/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${mode}: the ridge rewards a physical journey with a usable shortcut`, async ({
    page,
  }) => {
    await enter(page, mode);
    await walk(page, "Grey Ridge Mine", "mine", 1);
    await act(page, "gather-ore", 2);
    await expect(page.getByTestId("pack-ore")).toHaveText("2");
    await walk(page, "The Old Lookout", "ruins", 3);
    await expect(
      page.getByRole("button", { name: "Look at Willow village", exact: true }),
    ).not.toBeVisible();
    await act(page, "discover-ruins", 4);
    await expect(
      page.getByRole("region", { name: "What happened" }),
    ).toContainText("one day instead of three");
    await expect(page.getByTestId("journey-discover-ruins")).not.toBeVisible();
    await expect(page.getByTestId("pack-ore")).toHaveText("2");
    await walk(page, "Willow village", "willow", 5);
    await act(page, "deliver-willow", 6);
    await expect(page.getByTestId("pack-ore")).toHaveText("0");
    await expect(
      page.getByRole("button", {
        name: "Look at The Old Lookout",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("keyboard exploration inspects places without spending a day", async ({
  page,
}) => {
  await enter(page, "browser");
  const mine = page.getByRole("button", {
    name: /^Grey Ridge Mine,.*Inspect place$/,
  });
  await mine.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("journey-location")).toHaveText(
    "Grey Ridge Mine",
  );
  await expect(page.getByTestId("journey-travel-mine")).toBeVisible();
  await expect(page.getByTestId("journey-day")).toHaveText("Day 0");
  const wood = page.getByRole("button", {
    name: /^Common Wood,.*Inspect place$/,
  });
  await wood.focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("journey-location")).toHaveText(
    "The Common Wood",
  );
  await expect(page.getByTestId("journey-gather-timber")).toBeVisible();
  await expect(page.getByTestId("journey-day")).toHaveText("Day 0");
});

test("a stale shared tab refreshes the player's new location without gathering remotely", async ({
  page,
}) => {
  await enter(page, "server");
  const world = await (await page.request.get(`${api}/world`)).json();
  const moved = await page.request.post(`${api}/commands`, {
    data: {
      id: `other-walker-${Date.now()}`,
      command: {
        type: "journey-action",
        runId: world.runId,
        revision: world.journey.revision,
        action: "travel-mine",
      },
    },
  });
  expect(moved.ok()).toBe(true);
  await page.getByTestId("journey-gather-timber").click();
  await expect(page.getByRole("alert")).toContainText("out of date");
  await expect(page.getByTestId("journey-day")).toHaveText("Day 1");
  await expect(page.getByTestId("journey-location")).toHaveText(
    "Grey Ridge Mine",
  );
  await expect(page.getByTestId("pack-timber")).toHaveText("0");
  await expect(page.getByTestId("journey-gather-ore")).toBeEnabled();
  const after = await (await page.request.get(`${api}/world`)).json();
  expect(after.tick).toBe(1);
  expect(after.journey.revision).toBe(world.journey.revision + 1);
  expect(after.journey.gathered).toEqual({ timber: 0, ore: 0 });
});
