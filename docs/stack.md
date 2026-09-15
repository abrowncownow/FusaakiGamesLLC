# Stack decision: the game foundation

September 14, 2026. Chosen for a one-person studio with 12 human hours a week, browser testing, and a future persistent asynchronous world. These are engineering decisions, not performance measurements.

| Layer                    | Decision                                                                       | Reason                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime and language     | Node 24 LTS, strict TypeScript                                                 | One language for the simulation, browser, tests, and world service; current development machine uses Node 24.19.0.                                                            |
| Workspace                | pnpm workspaces, one lockfile                                                  | Keep the existing company website and add independently runnable game packages without a repository migration or orchestration framework.                                     |
| Browser                  | React + Vite                                                                   | React handles jobs, inventories, and decisions; Vite produces a small static build for rapid browser testing.                                                                 |
| World logic              | Pure TypeScript package                                                        | Explicit commands and state transitions run identically in fast tests, an isolated browser scenario, and the Node service. No rendering or database dependency in the engine. |
| Authoritative service    | Fastify on a long-running Node process                                         | Straightforward command validation and in-process API tests; eventual scheduled simulation and persistence do not depend on a browser remaining open.                         |
| Production persistence   | PostgreSQL; managed hosting chosen when we measure the simulation              | Transactional inventories, receipts, migrations, and world ownership are the next server milestone. No database or paid service is provisioned in this foundation.            |
| Rendering and assets     | SVG/CSS for the current scenario; Three.js + GLB/glTF for the intended 3D view | Establish the simulation before adding a renderer. Three.js, Blender, and an asset conversion toolchain are not installed or required for this fixture.                       |
| Verification             | ESLint, TypeScript, Vitest, Playwright                                         | Check model integrity, API retries/validation, browser behavior, and desktop/mobile layouts.                                                                                  |
| Integration and delivery | GitHub Actions + existing GitHub Pages                                         | Feature branches/PRs build downloadable previews; checked `main` builds publish the website with a `/play/` scenario.                                                         |

## Why the server choice changed

The initial plan considered Supabase Edge Functions for the world loop. Autonomous societies make a dedicated Node simulation service a better starting architecture: execution, scheduling, and state ownership are explicit and portable. Supabase remains an option for managed PostgreSQL and authentication. Its hosted Edge Functions have CPU and worker-lifetime limits, so selecting them for continuous world simulation would require workload evidence. This is not a claim that a small scheduled simulation cannot fit those limits. [Supabase function limits](https://supabase.com/docs/guides/functions/limits).

Fastify separates constructing the application from listening on a socket; its injection API lets us test real routing and validation without starting a network server. [Fastify testing](https://fastify.dev/docs/latest/Guides/Testing/).

The existing Next.js React lint plugins do not support ESLint 10 yet; the workspace retains the tested ESLint 9.39.5 compatibility pin. Upgrade that tool with compatible plugins rather than ignoring peer warnings or accepting a broken quality gate.

Node 24 is the selected LTS line; we pin the tested patch in `.node-version` and use it in CI. Packages are pinned with a committed lockfile, and installation uses `--frozen-lockfile` in CI. Update versions deliberately through a tested PR. [Node release schedule](https://github.com/nodejs/Release).

## What exists now

`apps/game` runs an autonomous settlement experiment. `packages/simulation` supplies a common needs planner: crews forage, gather timber, mine ore, transport cargo, build a workshop, then craft tools. Food and labor constrain each choice. A player can join a timber crew or intercept a convoy. Lost cargo reopens material needs; future shipments may receive funded escorts or carry smaller loads. `apps/server` runs the same simulation behind a validated HTTP command API with in-memory retry receipts.

The default browser experience is now **The First Charter**: choose a sponsor, make a small set of time-costed decisions, earn trust through actual work or supplies, and face an inspection on day 21. The same NPC economy drives its consequences and endings. The detailed planner, seeded experiments and resource inspection remain in the optional Lab. See the [First Charter playtest](first-charter.md) and [simulation guide](simulation.md).

This is still a bounded experiment: workshop and tool targets are fixed, food is renewable, tools do not yet affect productivity, and interception uses a simple declared rule. Charter trust is a small scenario mechanic, not a general relationship or political system. Accounts, durable storage, authoritative elapsed time, trade, NPC recruitment, broad diplomacy, and knowledge systems remain future work.

The default browser preview is isolated per page and resets on reload. The optional local server mode shares state in server memory and loses it on server restart. The server binds to loopback and is not deployed to Pages. Publishing an isolated browser scenario does not constitute a persistent online world.

## Boundaries to preserve

- Rendering reads world state and submits commands; it never becomes the production authority on inventory or time.
- Simulation functions receive explicit state and commands; no wall-clock reads, network calls, rendering, or unseeded randomness inside them.
- The eventual server authenticates the actor, validates authority, executes each command transactionally, and stores its receipt with the resulting state. Current retry receipts only last for the development server's lifetime.
- One process/worker owns a world's advancement. Multi-process ownership, scheduling, recovery, migrations, and backup/restore must be validated before shared persistent testing.
- No runtime language-model API calls or paid art subscriptions are required for this foundation.

## Pipeline and costs

GitHub Pages is already configured for this public repository. After a reviewed merge, the new pipeline publishes the tested static website and browser scenario together. Each PR also produces `game-preview` and `site-bundle` artifacts with a commit identifier; these are downloads, not automatically hosted per-PR URLs. [Vite deployment](https://vite.dev/guide/static-deploy.html).

No additional account or subscription was purchased. The local development tools are free. Hosting a persistent Node service and PostgreSQL will be a separate measured decision within the existing budget. Mobile/Steam packaging follows a working game; choosing a web client does not remove those platform integration costs.
