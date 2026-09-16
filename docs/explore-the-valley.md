# Explore the valley

The default game opens onto a small illustrated valley. You have a visible location and a pack; the forest, mine, two communities and an old lookout are places to visit. This playtest asks whether moving through the world and handling its goods feels more engaging than choosing abstract work orders.

Enter the valley, try cutting timber, then choose somewhere to take it. Clicking a place inspects it for free. **Walk** follows a connected road and costs one day. Gathering, delivering, building, surveying and watching the valley each also cost one day. Both NPC communities continue their real work during every action. There is no deadline or hunger meter in this experiment.

## Things to try

- Carry timber or ore to whichever community you want to help. The pack loses the same materials the village receives.
- Look at the construction site before and after its materials arrive. Join construction when it is funded, or watch the crew finish it themselves.
- Follow the ridge to the old lookout. Surveying it reveals a usable shortcut; finding it does not create free goods.
- Watch shipments cross the valley and inspect what the crews are currently doing.

The first feedback we need is whether you feel present in a place, understand what you can act on, and become curious about where to go next. Note where the world feels unresponsive, where you expected a different interaction, and whether you wanted another trip. The loop is deliberately small; it is not yet a long-term progression game.

## Rules and limits

Player gathering yields up to four timber or two ore from the world's finite source stock. Handovers move up to eight carried goods into a local village's outstanding order; already committed goods count toward its need. Funded construction adds one player work before the NPC day runs, through the same building function used by NPCs. Workshops need 24 timber, 8 ore and six work; a finished workshop allows the existing two-tool order.

Movement follows five destinations and a route graph, with animated movement between them. This is not free movement through every point of the terrain. NPC figures and wagons visualize the simulation; animation itself does not advance time. Inspection exposes public state without a fog-of-war system. The lookout's one-time survey opens the direct lookout–Willow route.

Actions validate location, run ID and revision in the simulation. Failed or stale actions change neither time nor inventory. The local API uses the same command service and retry receipts. Schema version 4 adds the exploration state; no persisted saves exist to migrate.

Browser worlds reset on reload. The optional local server has one shared development actor and in-memory state. Accounts, persistent saves, an online clock, free movement, general trade and political institutions remain future work. No new dependency, paid service or runtime model API was added.

The earlier [First Charter challenge](first-charter.md) remains at `?view=charter`; the [World lab](simulation.md) remains at `?view=lab`. Switching browser modes starts an independent world. Server mode reads the same development world; starting a different experiment resets it explicitly.
