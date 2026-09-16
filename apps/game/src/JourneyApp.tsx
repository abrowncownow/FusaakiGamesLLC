import { useEffect, useRef, useState } from "react";
import {
  createWorld,
  getJourneyActions,
  JOURNEY_PLACES,
  representative,
  WORKSHOP_COST,
  committedRaw,
} from "@fusaakigames/simulation";
import type {
  Command,
  JourneyAction,
  JourneyPlaceId,
  World,
} from "@fusaakigames/simulation";
import { createClient } from "./client";
import { ValleyScene } from "./ValleyScene";
import "./journey.css";

declare const __BUILD_ID__: string;

function PackIcon({ kind }: { kind: "timber" | "ore" }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {kind === "timber" ? (
        <>
          <path d="M6 24 3 15 23 5 29 15Z" fill="#a26a3c" />
          <path d="m4 16 5 4L28 9l-5-4Z" fill="#d9a96a" />
          <ellipse cx="7" cy="20" rx="5" ry="6" fill="#efca8e" />
          <ellipse cx="7" cy="20" rx="2" ry="3" fill="none" stroke="#9c663b" />
        </>
      ) : (
        <>
          <path d="m4 25 2-13L18 4l10 8 1 13-13 5Z" fill="#738f99" />
          <path d="m6 12 12-8-1 15L4 25Z" fill="#b2c6c9" />
          <path d="m17 19 11-7 1 13-13 5Z" fill="#526d78" />
          <path d="m11 10 3-2-2 7-3 1Z" fill="#edf0cc" />
        </>
      )}
    </svg>
  );
}

function placeStory(world: World, place: JourneyPlaceId) {
  if (place === "wood")
    return "Axes carry through the trees. Two villages are building workshops, and both would find a use for whatever you bring back.";
  if (place === "mine")
    return "The ridge rings with picks. Timber gets a workshop started; ore gives its builders something to fasten it with.";
  if (place === "ruins")
    return world.journey?.discovery
      ? "Under the ivy: an old foresters’ trail straight down to Willow. You found a shorter way home from this side of the ridge."
      : "A broken lookout above the treeline. Someone once knew this valley well. There may be more here than a good view.";
  const group = world.settlements.find((entry) => entry.id === place)!;
  if (group.workshop.complete)
    return "The roof is up. Tools can now be made here, and the village has one less thing it has to do the hard way.";
  if (group.workshop.work > 0)
    return "The building has begun to look like a workshop. You can hear hammers before you reach the square.";
  return place === "willow"
    ? "A timber frame waits beside the cottages. Mara has drawn a roof on the plans three times. Rain remains unimpressed."
    : "Nix has marked out a workshop with stakes and considerable confidence. So far, the stakes are doing most of the work.";
}

function AtThisPlace({
  world,
  place,
}: {
  world: World;
  place: JourneyPlaceId;
}) {
  const group = world.settlements.find((entry) => entry.id === place);
  if (group) {
    const person = representative(group.id);
    return (
      <div className="valley-place-state">
        <p className="valley-voice">
          <b>{person.name}</b> · {group.lastAction}
        </p>
        {group.workshop.complete ? (
          <p className="valley-built">
            ✓ Workshop open · {group.home.tools} tools in store
          </p>
        ) : (
          <div
            className="valley-building-progress"
            aria-label={`${group.name} workshop progress`}
          >
            {(["timber", "ore"] as const).map((resource) => (
              <div key={resource}>
                <span>
                  {resource} secured{" "}
                  <b>
                    {Math.min(
                      WORKSHOP_COST[resource],
                      committedRaw(group, resource),
                    )}
                    /{WORKSHOP_COST[resource]}
                  </b>
                </span>
                <progress
                  aria-label={`${group.name} ${resource}`}
                  value={Math.min(
                    WORKSHOP_COST[resource],
                    committedRaw(group, resource),
                  )}
                  max={WORKSHOP_COST[resource]}
                />
              </div>
            ))}
            <small>
              {group.workshop.work > 0
                ? `Construction ${group.workshop.work}/6`
                : "The crew brings materials home before building."}
            </small>
          </div>
        )}
        {world.journey && world.journey.delivered[group.id] > 0 && (
          <p className="valley-your-mark">
            Your contribution: {world.journey.delivered[group.id]} materials
            delivered.
          </p>
        )}
      </div>
    );
  }
  if (place === "wood" || place === "mine") {
    const resource = place === "wood" ? "timber" : "ore";
    return (
      <div className="valley-place-state">
        <p className="valley-resource-left">
          {place === "wood" ? world.forestTimber : world.mineOre} {resource}{" "}
          left here
        </p>
        {world.settlements.map((entry) => {
          const chosen = entry.plan.chosen.action;
          const gathering =
            chosen.type === "gather" && chosen.resource === resource;
          return (
            <p className="valley-crew" key={entry.id}>
              <span className={`valley-dot valley-dot-${entry.id}`} />
              {entry.name}:{" "}
              {gathering
                ? `${chosen.workers} workers gathering`
                : `${entry.field[resource]} ${resource} waiting for transport`}
            </p>
          );
        })}
      </div>
    );
  }
  return (
    <p className="valley-place-state valley-discovery-hint">
      {world.journey?.discovery
        ? "Shortcut unlocked: Old Lookout ↔ Willow"
        : "Explore the lookout to find what the road signs missed."}
    </p>
  );
}

export function JourneyApp() {
  const [server] = useState(
    () => new URLSearchParams(location.search).get("mode") === "server",
  );
  const [client] = useState(() => createClient(server));
  const [world, setWorld] = useState<World>(createWorld);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<JourneyPlaceId>("wood");
  const [error, setError] = useState("");
  const [traveling, setTraveling] = useState(false);
  const pending = useRef(false);
  const placeHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let disposed = false;
    client
      .read()
      .then((next) => {
        if (disposed) return;
        setWorld(next);
        setSelected(next.journey?.location ?? "wood");
        setReady(true);
      })
      .catch(() => {
        if (!disposed)
          setError("The valley could not be reached. Reload to try again.");
      });
    return () => {
      disposed = true;
    };
  }, [client]);

  async function send(command: Command, travel = false) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setTraveling(travel);
    setError("");
    try {
      const next = await client.send(command);
      setWorld(next);
      setSelected(next.journey?.location ?? "wood");
      if (travel)
        await new Promise((resolve) => window.setTimeout(resolve, 800));
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "That action could not be completed.";
      try {
        const next = await client.read();
        setWorld(next);
        setSelected(next.journey?.location ?? "wood");
        setError(
          `${message} The latest valley is shown. Choose again when you are ready.`,
        );
      } catch {
        setError(`${message} Reload when your connection returns.`);
      }
    } finally {
      pending.current = false;
      setBusy(false);
      setTraveling(false);
    }
  }

  const run = world.journey;
  const place = JOURNEY_PLACES.find((entry) => entry.id === selected)!;
  const currentPlace = JOURNEY_PLACES.find(
    (entry) => entry.id === (run?.location ?? "wood"),
  )!;
  const here = selected === run?.location;
  const actions = run ? getJourneyActions(world) : [];
  const localActions = actions.filter((action) => action.kind !== "travel");
  const travelActions = actions.filter((action) => action.kind === "travel");
  const travelAction = travelActions.find(
    (action) => action.destination === selected,
  );
  const report = run?.reports.at(-1);
  const deliveries = run ? run.delivered.willow + run.delivered.bracken : 0;
  const workshops = world.settlements.filter(
    (entry) => entry.workshop.complete,
  ).length;
  const viewLink = (view: string) =>
    `?view=${view}${server ? "&mode=server" : ""}`;
  const act = (action: JourneyAction) => {
    if (!run) return;
    void send(
      {
        type: "journey-action",
        runId: world.runId,
        revision: run.revision,
        action: action.id,
      },
      action.kind === "travel",
    );
  };
  const selectPlace = (id: JourneyPlaceId) => {
    setSelected(id);
  };

  return (
    <div className="valley-app">
      <a className="valley-skip" href="#valley-actions">
        Skip to actions
      </a>
      <header className="valley-header">
        <div className="valley-wordmark">
          <span aria-hidden="true">F</span>
          <div>
            <small>FUSAAKI GAMES</small>
            <h1>The valley</h1>
          </div>
        </div>
        <nav aria-label="Game modes">
          <a href={viewLink("charter")}>The First Charter</a>
          <a href={viewLink("lab")}>World lab ↗</a>
        </nav>
        <div className="valley-day">
          <span className="valley-sun" aria-hidden="true">
            ☀
          </span>
          <strong data-testid="journey-day">Day {world.tick}</strong>
        </div>
      </header>
      <main className="valley-layout">
        <section className="valley-world" aria-label="Explore the valley">
          <div className="valley-world-topline">
            <div>
              <span className="valley-live-dot" /> THE COMMON VALLEY
            </div>
            <span>
              {run
                ? `${run.visited.length} / ${JOURNEY_PLACES.length} places visited`
                : "A SMALL WORLD. ROOM FOR YOU."}
            </span>
          </div>
          <div className="valley-scene-wrap">
            <ValleyScene
              world={world}
              selected={selected}
              onSelect={selectPlace}
              traveling={traveling}
            />
            {!run && (
              <div className="valley-welcome">
                <p className="valley-eyebrow">BOOTS ON THE GROUND</p>
                <h2>
                  Take the road.
                  <br />
                  Leave a mark.
                </h2>
                <p>
                  Cut timber. Carry it to a village. Watch a workshop rise. Or
                  follow the path up the ridge.
                </p>
                <button
                  className="valley-enter"
                  disabled={!ready || busy}
                  onClick={() =>
                    void send({ type: "start-journey", runId: world.runId })
                  }
                >
                  Enter the valley <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
          <div className="valley-map-footer">
            <p>
              <span aria-hidden="true">◆</span>{" "}
              {traveling
                ? `Walking to ${currentPlace.name}…`
                : `Your boots: ${currentPlace.name}`}
            </p>
            <span>Click a place to look around</span>
          </div>
          <div className="valley-pack" aria-label="Your pack">
            <div className="valley-pack-title">
              <b>Your pack</b>
              <span>Gather it. Carry it. Choose who gets it.</span>
            </div>
            {(["timber", "ore"] as const).map((resource) => (
              <div className="valley-pack-item" key={resource}>
                <PackIcon kind={resource} />
                <strong
                  key={world.player.inventory[resource]}
                  data-testid={`pack-${resource}`}
                >
                  {world.player.inventory[resource]}
                </strong>
                <span>{resource}</span>
              </div>
            ))}
          </div>
          {run && (
            <div
              className="valley-purpose"
              aria-label="Your mark on the valley"
            >
              <span className="valley-purpose-icon" aria-hidden="true">
                ⚑
              </span>
              <div>
                <b>
                  {workshops
                    ? "The valley is taking shape."
                    : deliveries
                      ? "Your materials are in their hands."
                      : "A little direction, if you want it."}
                </b>
                <p>
                  {workshops
                    ? `${workshops} workshop${workshops === 1 ? "" : "s"} built. You supplied ${deliveries} materials; the crews did their own work too.`
                    : deliveries
                      ? `${deliveries} materials delivered. Keep exploring, or help the crew finish the job.`
                      : "Bring timber to either village. Stay to see what they make of it."}
                </p>
              </div>
              {run.discovery && (
                <span className="valley-discovery-seal">Old trail found</span>
              )}
            </div>
          )}
        </section>
        <aside
          className="valley-sidebar"
          id="valley-actions"
          aria-label="Location and actions"
        >
          {error && (
            <p role="alert" className="valley-error">
              {error}
            </p>
          )}
          <section className="valley-location" aria-label="Selected place">
            <p className="valley-eyebrow">
              {here
                ? "YOU ARE HERE"
                : run?.visited.includes(selected)
                  ? "A FAMILIAR PLACE"
                  : "SOMEWHERE TO GO"}
            </p>
            <h2 ref={placeHeading} tabIndex={-1} data-testid="journey-location">
              {place.name}
            </h2>
            <p className="valley-place-story">{placeStory(world, selected)}</p>
            <AtThisPlace world={world} place={selected} />
            {run ? (
              <div
                className="valley-actions"
                aria-label="Available actions"
                aria-busy={busy}
              >
                {here ? (
                  localActions.map((action) => (
                    <button
                      className={`valley-action valley-action-${action.kind}`}
                      key={action.id}
                      disabled={busy || !ready}
                      data-testid={`journey-${action.id}`}
                      onClick={() => act(action)}
                    >
                      <span className="valley-action-heading">
                        <b>{action.title}</b>
                        <small>{action.cost}</small>
                      </span>
                      <span>{action.description}</span>
                    </button>
                  ))
                ) : travelAction ? (
                  <button
                    className="valley-action valley-action-travel"
                    disabled={busy || !ready}
                    data-testid={`journey-${travelAction.id}`}
                    onClick={() => act(travelAction)}
                  >
                    <span className="valley-action-heading">
                      <b>Walk to {place.name}</b>
                      <small>{travelAction.cost}</small>
                    </span>
                    <span>
                      The crews keep working while you take the road. →
                    </span>
                  </button>
                ) : (
                  <div className="valley-no-road">
                    <b>No direct path from here.</b>
                    <p>
                      Take one of the nearby roads below. Looking around costs
                      nothing.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="valley-start-hint">
                Your empty pack has room for a beginning.
              </p>
            )}
            {run && (
              <div className="valley-nearby">
                <h3>Roads from {currentPlace.name}</h3>
                <div>
                  {travelActions.map((action) => (
                    <button
                      key={action.id}
                      disabled={busy}
                      onClick={() => {
                        setSelected(action.destination!);
                        placeHeading.current?.focus();
                      }}
                      aria-label={`Look at ${JOURNEY_PLACES.find((entry) => entry.id === action.destination)!.name}`}
                    >
                      {
                        JOURNEY_PLACES.find(
                          (entry) => entry.id === action.destination,
                        )!.name
                      }{" "}
                      <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
                <p>
                  Walking and work each move the world one day. There is no
                  deadline.
                </p>
              </div>
            )}
          </section>
          {run && (
            <section
              className="valley-reaction"
              aria-label="What happened"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="valley-eyebrow">
                {report
                  ? `DAY ${report.toDay} · YOUR FOOTSTEPS`
                  : "YOUR FIRST FOOTSTEPS"}
              </p>
              <h2>{report?.title ?? "You can start with an axe."}</h2>
              <p>
                {report?.text ??
                  "Cut some timber here, then click a village and take it down the road. What happens next is up to you."}
              </p>
            </section>
          )}
          {run && run.reports.length > 0 && (
            <details className="valley-journal">
              <summary>Your trail · {run.reports.length} actions</summary>
              <ol>
                {[...run.reports].reverse().map((entry) => (
                  <li key={entry.revision}>
                    <small>DAY {entry.toDay}</small>
                    <b>{entry.title}</b>
                    <p>{entry.text}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </aside>
      </main>
      <footer className="valley-footer">
        <span>
          {server
            ? "Local shared test world · resets with the server."
            : "Your own valley · reloading starts fresh."}{" "}
          <span className="valley-build">PLAYTEST {__BUILD_ID__}</span>
        </span>
        <span>
          Click places to inspect. Choose an action to change the world.
        </span>
      </footer>
    </div>
  );
}
