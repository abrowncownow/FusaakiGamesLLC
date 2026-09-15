# Autonomous settlements: tester and simulation guide

The current experiment tests one causal loop: a community needs materials, assigns work, ships cargo, suffers or benefits from player intervention, then chooses its next job from the changed state. It runs in the isolated browser preview and through the local development API.

First-time players should start with **The First Charter**, the default game view. Its [playtest guide](first-charter.md) explains the short contract and the feedback we need. The inspection instructions below apply to **World lab**, opened from the game or by adding `?view=lab` to the URL (`&view=lab` if it already has query parameters).

## World lab playtest

1. Choose **Balanced**, seed **7**, then **Reset scenario**. Each settlement has four NPCs and 24 food. Without intervention, both workshops finish on day 23, followed by a two-tool order.
2. Reset, join Willow as a new harvester, and advance one day. Willow gathers four timber to Bracken's two. Leave: your work remains while the NPCs continue. A skilled character contributes four timber per working day instead of two. The host spends one meal each day you work.
3. Reset and select **Next shipment**. On day 9, both communities dispatch 12 timber without escorts. Intercept Willow: with seed 7, nine timber moves into your pack, one of your six starting rations is consumed, and three timber remains on the convoy. Bracken's threat assessment is unchanged.
4. Advance ten days. Willow's next timber shipment has two escorts and a driver, leaving one resident at home. Attempt another interception: the guards repel you; your ration is spent and their cargo is preserved. Read the chronicle and inspect Willow's next decision and worker budget.
5. Reset with **Food shortage**. Three NPCs forage and one gathers on the first day. Reset with **Small crews** to see two-person communities work more slowly. Repeated losses cannot create guards: these crews eventually ship smaller loads to reduce exposure.

Report the build ID in the header, starting preset, seed and command sequence. Useful feedback: Did you understand what the NPCs wanted? Did you see why they changed plans? Did helping or interfering feel consequential? Which decision would you want to make next? This is a behavior test; it does not establish that the game is fun or balanced yet.

## Rules and accounting

- A workshop needs 24 timber, 8 ore and 6 units of construction work. It unlocks a fixed order for two tools. Each tool requires two workers for a day, two timber and one ore. Tools are currently an output and capability demonstration; they do not increase productivity yet.
- Each NPC eats one food per day. Foragers produce four food each from a renewable source. The planner allocates food workers before choosing other jobs, aiming for three days of meals at home. The initial empty-pantry preset can recover without receiving hidden supplies.
- Harvesters and miners produce one raw unit each per day, with at most two NPCs on the chosen gathering job. A player can contribute two or four timber to an open order. Gathering is capped by the remaining requisition and finite source stock. Goods at the source, in transit, at home and reserved for construction all count toward the order.
- A settlement has one caravan, with a capacity of 12 units and a three-day journey. A driver and up to two escorts come from the existing workforce. At least one resident stays home to maintain food production. Three meals per traveler are packed from home stock; departure day consumes the first meal. The crew eats at home again on arrival day.
- An interception costs the player one ration, with one attempt per day and per convoy. A seeded roll takes 6–10 units from an unguarded load; one guard reduces the haul by three, two guards repel it. Loot cannot exceed actual cargo. Stolen raw materials transfer into the player's inventory, and missing inputs become outstanding work again. No NPC is killed in this experiment.
- A successful theft adds 50 route threat, a repelled attempt adds 15, capped at 100. This assessment concerns the attacking player only. Threat discounts exposed shipments in the planner. At high threat, smaller loads become another option with an extra-trip penalty. There is no automatic retaliation event, threat decay or reputation network yet.
- The same feasible-choice planner serves both communities. Willow weights security more heavily; Bracken weights growth more heavily. Scores are design parameters, not estimates from market or playtest data. A high score cannot bypass labor, food, cargo or capability requirements.

The ledger explicitly records food gathered and eaten, raw materials used in construction/crafting, and tools produced. Loss counters are statistics, not a second inventory. Unit tests conserve timber and ore across all locations and consumed inputs, reconcile food sources/sinks, and enforce integer, nonnegative stocks and worker budgets through repeated raids.

## Code and command boundaries

`packages/simulation/src/model.ts` defines the world and commands. `planner.ts` calculates needs, feasible choices and the next worker allocation. `engine.ts` applies commands and advances days; its integer random generator reads only the stored seed state. `index.ts` exposes the engine and the in-memory development service with retry receipts. Neither rendering nor network calls enter the simulation.

Within a day: existing convoys move and arrive, communities allocate workers and execute jobs, an assigned player contributes, and meals are consumed. Displayed plans are then recomputed for the next day. The deterministic iteration order is Willow then Bracken; competition over the last units of a shared source therefore favors the first settlement. Fair resource scheduling is a future design decision, not a solved market mechanic.

Commands are strictly validated. `advance` accepts 1–30 days; `next-convoy` stops at any available convoy or after 30 days. `reset` accepts the preset and an unsigned 32-bit seed. `intercept` includes the convoy ID, so a stale request cannot attack a replacement convoy. Convoy IDs continue increasing across resets within one service lifetime; resetting the same seed reproduces outcomes but does not recycle IDs. Repeating the same command ID returns its original result without changing inventory or consuming randomness again; a conflicting payload is rejected.

## Current limits and next steps

World schema version is now 3. There are no durable saves to migrate. Browser worlds remain isolated per page and reset on reload; server mode shares a single development actor in memory and resets on server restart. Time moves through player choices in Charter mode and explicit controls in the Lab. Charter commands carry a run ID and decision revision so old clicks cannot resolve a new choice, and normal Lab commands cannot bypass a charter's deadline or ending. The local API is not a public authenticated game service.

The current experiment has fixed settlement populations and starter goals, a single player, renewable food, and bounded convoy interactions. Trade, wages, player organizations, NPC recruitment, policies, general relationships, knowledge assets, 3D art and combat are still outside this slice. Charter mode adds limited trust and permits handing actual carried raw materials to a community with an unmet order. This is a supply handover at the village followed by distribution work; player travel is not modeled. The pack cannot sell loot yet; resetting the experiment restores raid rations.

The next infrastructure milestone remains authenticated actors, PostgreSQL state and durable receipts committed together, an authoritative scheduler, and restart/restore tests. Before adding more economy systems, use the playtest feedback to choose the next meaningful player decision. No new dependency or paid service was added for this slice.
