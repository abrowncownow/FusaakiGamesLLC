# Develop and deliver a change

## First setup

Use Node **24.19.0** (see `.node-version`) and pnpm **11.19.0** (see `package.json`). The project uses exact package versions and one workspace lockfile.

`package.json` also pins the development runtime through `devEngines.runtime`: pnpm downloads and uses Node 24.19.0 for project commands. A Node 24.18.1 installation can bootstrap pnpm, but the project scripts use the locked runtime. This avoids differences between the shell's Node and the runtime used by child processes.

```powershell
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm game:dev
```

The browser starts at **http://127.0.0.1:5173/** with **The First Charter**, a short playable chapter. Use **?view=lab** for the detailed simulation dashboard. Add **mode=server** to either view's query string to exercise the local Fastify API at port 4310. Stop development with Ctrl+C. The simulation compiler, API watcher, and browser dev server are started together. The browser uses compiled simulation exports; saving engine code triggers a rebuild.

Docker is not required for this fixture. PostgreSQL and hosted authentication are the next infrastructure milestone, before shared persistent play. No API keys are needed now. Never put future database or service-role credentials in a `VITE_` variable, because browser build variables are public.

## Useful commands

| Command               | Purpose                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`            | Existing company website                                                                      |
| `pnpm game:dev`       | Game, simulation watch, and local world API                                                   |
| `pnpm game:test`      | Simulation and API tests                                                                      |
| `pnpm game:build`     | Compile simulation, API, and static browser app                                               |
| `pnpm game:preview`   | Inspect a built browser bundle at port 4173                                                   |
| `pnpm game:test:e2e`  | Build, then test browser and local server modes at desktop/mobile widths                      |
| `pnpm check`          | Formatting, lint, type checks, unit/API tests, and both app builds                            |
| `pnpm verify`         | All checks plus website and game browser tests                                                |
| `pnpm release:bundle` | After builds, package `.artifacts/site` and `.artifacts/game`; copy the game into `out/play/` |

Test ports 3000, 4173, and 4310 must be available for end-to-end tests. Stop `game:dev` before `game:test:e2e` or `verify`; tests launch their own API instance. The test scenario exposes time controls and profile presets for inspection, not as finished player progression rules.

## Make and review a change

1. Start a `codex/<description>` branch from current `main`.
2. Change the smallest useful behavior and add a test for material simulation or API invariants. Keep source art and licenses traceable when assets are added.
3. Run `pnpm verify`. For a targeted iteration, run the relevant package checks first, then the full gate before the PR is ready.
4. Commit the source/configuration and updated lockfile. Push the feature branch and open a PR with a concrete before/after description and tester instructions.
5. GitHub Actions repeats the checks on Windows and Linux. Failed browser tests attach traces/screenshots; successful Linux jobs attach `game-preview` and `site-bundle` downloads. Download `game-preview` and serve its directory using a static server; opening `index.html` as a `file://` URL does not support the app's module assets.
6. Review the change and merge when ready. The Pages workflow repeats the quality gate on the actual `main` commit and publishes that exact artifact. It does not rebuild a different payload after testing.

Stable browser test destination after a reviewed merge: **https://abrowncownow.github.io/FusaakiGamesLLC/play/**. This is an isolated scenario for each tester, not a shared persistent realm. The build ID is visible in the header and in `play/build.json`. Start with the [First Charter playtest](first-charter.md); use the [simulation tester guide](simulation.md) for assistance, cargo loss, food shortages and constrained escorts in the Lab.

This workflow does not configure GitHub branch protection or produce live per-PR preview URLs. Required checks can be enabled in repository rules after the new workflow has run. If per-PR hosted URLs become necessary, attach a dedicated preview host to `apps/game`; do not let arbitrary PR builds replace the company website.

## Release and rollback

`main` automatically publishes only after the reusable quality workflow passes. Manual Pages dispatch should use `main` as well. The optional AWS workflow remains manual and deploys the company site; it is not the game server deployment.

For a bad browser release, revert the offending commit through a PR and let the normal checks/publish flow run. Keep the commit ID and the failing behavior in the revert description so the regression can be reproduced. Do not reuse this static rollback approach for a future database migration without a compatible recovery plan.

## Before opening a persistent realm

The next infrastructure work is PostgreSQL migrations, transactional state plus durable command receipts, an authenticated principal model, a single world scheduler with restart recovery, and a restore drill. Then add a separately configured staging service, production deploy checks, and measured hosting limits. Current local API state is ephemeral and its commands are development controls.
