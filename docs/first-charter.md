# The First Charter

The default game view is a short playable contract built on the autonomous settlement simulation. You are an independent organizer seeking permission to found a guild. Choose Willow or Bracken as your patron, then earn its backing at the day 21 inspection: it needs a completed workshop and at least two trust in you. The chapter ends with the charter decision; founding and managing the guild itself are future work.

NPCs keep gathering, eating, shipping and building while you make decisions. Your time is scarce; helping one community means spending time you could have given the other. The aim is roughly seven decisions and a worthwhile replay, rather than a promised session length. Whether those decisions are fun is still a playtest question.

## First playtest

Open the game normally and play to the inspection using the information on screen. Choose a patron you would like to help. There is no prescribed route to follow or optimal sequence to memorize.

After the result, try another approach if you want to. Report the build ID, your patron, the ending, and any moment where the next action or its consequence was unclear. Useful feedback:

- Could you explain your role and goal before making your first decision?
- Did the choices make their costs clear, and did their consequences make sense?
- Did you care what happened to the neighboring community?
- Did you want to replay? What would you do differently?

The detailed simulation dashboard remains available through **World lab**, or by adding `?view=lab` to the game URL. The [simulation guide](simulation.md) describes its inspection tools. First-time players do not need to read that guide before playing.

## Decisions and consequences

The engine offers at most three choices from the current state. It validates those choices when they are submitted; the interface cannot grant materials or trust on its own.

- **Work a shift.** Join a community's timber crew for up to three days, contributing two timber per working day while NPCs continue their own jobs. Production is capped by the real requisition and remaining forest stock. The host pays your meals; you leave the crew after the shift. A shift that actually produces timber earns one trust with that community. Empty work earns nothing.
- **Take an opportunity.** When an eligible convoy is on the road, an interception can take actual cargo. It costs a ration, harms the victim's trust, and changes its route threat. Missing goods must be replaced, and subsequent guards come from the victim's workforce. Alternatively, supply a community with goods already in your pack: up to eight units, capped by its live outstanding need, for one ration and three days spent distributing supplies. An actual delivery earns one trust. Materials always move between existing inventories.
- **Hear the next report.** Let the autonomous crews continue for up to three days, stopping earlier at a relevant milestone. This is useful while cargo travels or construction finishes; an unavailable requisition is not presented as productive work.

Reports show your actual contribution, a relationship response, and key changes elsewhere in the world. Light humor belongs in how people react; shortages, lost shipments and spent time retain their mechanical consequences.

At the inspection, the result checks your patron's workshop and trust. Helping both communities can earn a shared ending. Theft can produce a costly success, with the neighbor's losses and response included in the account. The ending also compares workshop completion with an NPC-only run through day 21, so your intervention has a concrete reference point.

## Boundaries of this experiment

This is one fixed, single-player contract with two autonomous communities. Fresh runs use seed 7. Replaying resets the scenario while retaining monotonically increasing run IDs within the service lifetime. Run and revision checks reject outdated choices; retry receipts prevent the same accepted action from applying twice. The world schema is version 3.

Trust here is a small contract relationship mechanic. Wages, recruitment, currency, general trade, guilds and political institutions remain future work. This slice adds no runtime AI, paid service or new art dependency.

Browser worlds remain isolated and reset on reload. The optional local API still uses one development actor and in-memory state. There are no persistent accounts or saves yet; the first purpose of this campaign is to learn whether a clear role, visible consequences and a definite ending make the simulation worth playing.
