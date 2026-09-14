import { spawnSync } from "node:child_process";

const pnpm = process.env.npm_execpath;
if (!pnpm) throw new Error("Run through pnpm verify.");
for (const args of [[], ["--config", "playwright.game.config.ts"]]) {
  const result = spawnSync(
    process.execPath,
    [pnpm, "exec", "playwright", "test", ...args],
    {
      stdio: "inherit",
      windowsHide: true,
      env: { ...process.env, TEST_RELEASE_BUNDLE: "true" },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
