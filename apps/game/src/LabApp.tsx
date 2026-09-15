import { useEffect, useRef, useState } from "react";
import {
  canHarvest,
  committedRaw,
  createWorld,
  WORKSHOP_COST,
} from "@fusaakigames/simulation";
import type {
  Command,
  Profile,
  Scenario,
  Settlement,
  World,
} from "@fusaakigames/simulation";
import { createClient } from "./client";
import { WorldMap } from "./WorldMap";

declare const __BUILD_ID__: string;

function SettlementCard({ group }: { group: Settlement }) {
  const workers = group.plan.workers;
  return (
    <article className="settlement-card" data-testid={`settlement-${group.id}`}>
      <div className="card-title">
        <h2>{group.name}</h2>
        <span
          className={`stage ${group.workshop.complete ? "stage-complete" : ""}`}
        >
          {group.workshop.complete ? "Workshop built" : "Workshop planned"}
        </span>
      </div>
      <div className="stock-grid" aria-label={`${group.name} home inventory`}>
        {(["food", "timber", "ore", "tools"] as const).map((resource) => (
          <div key={resource}>
            <span>{resource} at home</span>
            <strong data-testid={`${group.id}-${resource}`}>
              {group.home[resource]}
            </strong>
          </div>
        ))}
      </div>
      {!group.workshop.complete &&
        (["timber", "ore"] as const).map((resource) => {
          const amount = Math.min(
            WORKSHOP_COST[resource],
            committedRaw(group, resource),
          );
          return (
            <div className="resource-progress" key={resource}>
              <div className="progress-caption">
                <span>Workshop {resource} secured</span>
                <strong>
                  {amount} / {WORKSHOP_COST[resource]}
                </strong>
              </div>
              <progress
                value={amount}
                max={WORKSHOP_COST[resource]}
                aria-label={`${group.name} workshop ${resource}`}
              />
            </div>
          );
        })}
      <p className="project-note">
        {group.workshop.complete
          ? `Tool order: ${group.home.tools} / 2. Each tool uses 2 timber and 1 ore.`
          : `Secured materials include goods at the source, on the road and reserved for construction. Building: ${group.workshop.work} / 6 work.`}
      </p>
      <div className="inventory-line">
        <span>
          At forest{" "}
          <b data-testid={`${group.id}-forest`}>{group.field.timber}</b>
        </span>
        <span>
          At mine <b>{group.field.ore}</b>
        </span>
        <span>
          Lost{" "}
          <b>
            {group.losses.timber} timber · {group.losses.ore} ore
          </b>
        </span>
      </div>
      <div className="decision">
        <p className="eyebrow">NEXT DECISION</p>
        <h3 data-testid={`${group.id}-decision`}>{group.plan.chosen.label}</h3>
        <p>{group.plan.chosen.reason}</p>
        <p className="worker-budget" data-testid={`${group.id}-workers`}>
          {group.workers} NPCs: {workers.foraging} forage · {workers.production}{" "}
          produce · {workers.traveling} travel · {workers.resting} rest
        </p>
        <p className="field-note">
          Threat from you: <b>{group.threatFromPlayer} / 100</b>. Guards must
          come from this same crew.
        </p>
        <details>
          <summary>Compare available choices</summary>
          <p className="field-note">
            Higher scores win among affordable choices. Food is reserved first.
            Both societies use these rules with different growth and security
            priorities.
          </p>
          <ul className="choices">
            {[...group.plan.candidates]
              .sort((a, b) => b.score - a.score)
              .map((candidate) => (
                <li
                  key={candidate.label}
                  className={candidate.feasible ? "" : "unavailable"}
                >
                  <div>
                    <strong>{candidate.label}</strong>
                    <span>
                      {candidate.feasible
                        ? `${candidate.score} points`
                        : "Unavailable"}
                    </span>
                  </div>
                  <p>{candidate.reason}</p>
                </li>
              ))}
          </ul>
        </details>
      </div>
    </article>
  );
}

export function LabApp() {
  const [server] = useState(
    () => new URLSearchParams(location.search).get("mode") === "server",
  );
  const [client] = useState(() => createClient(server));
  const [world, setWorld] = useState<World>(createWorld);
  const [profile, setProfile] = useState<Profile>("novice");
  const [scenario, setScenario] = useState<Scenario>("balanced");
  const [seed, setSeed] = useState("7");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    let disposed = false;
    client
      .read()
      .then((next) => {
        if (!disposed) {
          setWorld(next);
          setScenario(next.scenario);
          setSeed(String(next.seed));
          setReady(true);
        }
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Could not reach the development server. Start pnpm game:dev, then reload.",
          );
      });
    return () => {
      disposed = true;
    };
  }, [client]);
  async function send(command: Command) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      setWorld(await client.send(command));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The action could not be completed.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const disabled = busy || !ready;
  const assignment = world.player.assignment;
  const completed = world.settlements.filter(
    (group) => group.workshop.complete,
  ).length;
  const validSeed = /^\d+$/.test(seed) && Number(seed) <= 0xffffffff;
  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href={server ? "?mode=server" : "./"}>
          <span className="crest" aria-hidden="true">
            F
          </span>
          <span>
            FUSAAKI<span className="wordmark-small">GAMES · WORLD LAB</span>
          </span>
        </a>
        <span className="build-label">
          <span className="status-dot" /> PROTOTYPE · {__BUILD_ID__}
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">A WORLD WITH ITS OWN AMBITIONS</p>
            <h1>The Charter</h1>
            <p className="subtitle">
              The work is already underway. Find your place in it.
            </p>
          </div>
          <div className="scenario-label">
            SCENARIO 02<span>The cost of a missing shipment</span>
          </div>
        </div>
        <div className="experiment-controls">
          <div>
            <label htmlFor="scenario">Starting conditions</label>
            <select
              id="scenario"
              value={scenario}
              disabled={disabled}
              onChange={(event) => setScenario(event.target.value as Scenario)}
            >
              <option value="balanced">
                Balanced · 4 workers, stocked pantry
              </option>
              <option value="food-shortage">
                Food shortage · empty pantries
              </option>
              <option value="small-crew">Small crews · 2 workers each</option>
            </select>
          </div>
          <div className="seed-control">
            <label htmlFor="seed">Replay seed</label>
            <input
              id="seed"
              type="text"
              inputMode="numeric"
              value={seed}
              disabled={disabled}
              aria-invalid={!validSeed}
              onChange={(event) => setSeed(event.target.value)}
            />
          </div>
          <button
            disabled={disabled || !validSeed}
            onClick={() =>
              void send({ type: "reset", scenario, seed: Number(seed) })
            }
          >
            Reset scenario
          </button>
          <p>
            Reset applies these settings. Current world:{" "}
            {world.scenario.replaceAll("-", " ")} · seed {world.seed}.
          </p>
        </div>
        <div className="workspace">
          <section className="world-panel" aria-label="World overview">
            <div className="panel-heading">
              <div>
                <span className="status-dot" />
                {server ? "LOCAL SERVER WORLD" : "YOUR BROWSER SANDBOX"}
              </div>
              <span data-testid="world-tick">Day {world.tick}</span>
            </div>
            <WorldMap groups={world.settlements} />
            <div className="world-stats">
              <div>
                <span>Timber / ore remaining</span>
                <strong>
                  {world.forestTimber} <small>/ {world.mineOre}</small>
                </strong>
              </div>
              <div>
                <span>NPC workers</span>
                <strong>
                  {world.settlements.reduce(
                    (sum, group) => sum + group.workers,
                    0,
                  )}
                </strong>
              </div>
              <div>
                <span>Workshops built</span>
                <strong>
                  {completed} <small>/ 2</small>
                </strong>
              </div>
            </div>
            <div className="time-controls">
              <span>Scenario clock</span>
              <button
                disabled={disabled}
                onClick={() => void send({ type: "advance", steps: 1 })}
              >
                +1 day
              </button>
              <button
                disabled={disabled}
                onClick={() => void send({ type: "advance", steps: 10 })}
              >
                +10 days
              </button>
              <button
                className="primary"
                disabled={disabled}
                onClick={() => void send({ type: "next-convoy" })}
              >
                Next shipment →
              </button>
            </div>
            <p className="clock-note">
              Next shipment stops at an available convoy, up to 30 days ahead.
              Time advances only with these controls.
            </p>
          </section>
          <aside
            className="participation-panel"
            aria-label="Player participation"
          >
            <p className="eyebrow">MAKE A DIFFERENCE</p>
            <h2>Lend the crew a hand.</h2>
            <p>
              Crews balance food, materials and transport on their own. Join a
              timber requisition to free up their time. The host pays for your
              daily meal.
            </p>
            <label htmlFor="profile">Test character</label>
            <select
              id="profile"
              value={profile}
              disabled={disabled || assignment !== null}
              onChange={(event) => setProfile(event.target.value as Profile)}
            >
              <option value="novice">New harvester · 2 timber / day</option>
              <option value="skilled">
                Skilled harvester · 4 timber / day
              </option>
            </select>
            <p className="field-note">
              Each NPC gathers 1 timber per day. You help until the timber order
              is filled or you leave.
            </p>
            {world.settlements.map((group) => (
              <button
                key={group.id}
                className={`join-button ${group.id === "willow" ? "primary" : ""}`}
                disabled={
                  disabled || assignment !== null || !canHarvest(world, group)
                }
                onClick={() =>
                  void send({ type: "join", settlementId: group.id, profile })
                }
              >
                {assignment?.settlementId === group.id
                  ? `Working with ${group.id === "willow" ? "Willow" : "Bracken"}`
                  : `Join ${group.id === "willow" ? "Willow" : "Bracken"} crew`}
              </button>
            ))}
            <button
              className="leave-button"
              disabled={disabled || assignment === null}
              onClick={() => void send({ type: "leave" })}
            >
              Leave the crew
            </button>
            <div className="participation-note">
              <span aria-hidden="true">↗</span>
              <p>
                Work remains when you leave. Compare the communities below to
                see what your contribution changes.
              </p>
            </div>
          </aside>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <section className="shipments" aria-label="Convoys on the road">
          <div className="shipment-intro">
            <div>
              <p className="eyebrow">A DIFFERENT KIND OF INTERVENTION</p>
              <h2>Life on the road.</h2>
              <p>
                Try intercepting a shipment, then watch what its owners can
                afford to do next.
              </p>
            </div>
            <div className="player-pack" data-testid="player-pack">
              <span>Your pack</span>
              <strong>
                {world.player.inventory.food} rations ·{" "}
                {world.player.inventory.timber} timber ·{" "}
                {world.player.inventory.ore} ore
              </strong>
            </div>
          </div>
          <p className="raid-rules">
            An attempt costs 1 ration. Your strength is 2: no guards lose 6–10
            cargo, one guard reduces the haul by 3, and two guards repel you.
            Cargo limits the haul. Once per convoy and once per day; leave your
            work crew first.
          </p>
          <div className="shipment-grid">
            {world.settlements.map((group) => {
              const convoy = group.convoy;
              return (
                <article
                  key={group.id}
                  className="shipment-card"
                  data-testid={`convoy-${group.id}`}
                >
                  <h3>{group.name}</h3>
                  {convoy ? (
                    <>
                      <p className="cargo-amount">
                        <strong>{convoy.amount}</strong> {convoy.resource}{" "}
                        <span>
                          arrives in {convoy.travelRemaining}{" "}
                          {convoy.travelRemaining === 1 ? "day" : "days"}
                        </span>
                      </p>
                      <p>
                        <b>{convoy.escorts} escorts</b> + 1 driver ·{" "}
                        {convoy.provisions} rations remaining
                      </p>
                      <button
                        disabled={
                          disabled ||
                          assignment !== null ||
                          convoy.intercepted ||
                          world.player.lastRaidTick === world.tick ||
                          world.player.inventory.food < 1
                        }
                        onClick={() =>
                          void send({
                            type: "intercept",
                            settlementId: group.id,
                            convoyId: convoy.id,
                          })
                        }
                      >
                        {convoy.intercepted
                          ? "Interception resolved"
                          : `Intercept ${group.id === "willow" ? "Willow" : "Bracken"} convoy`}
                      </button>
                    </>
                  ) : (
                    <p className="empty-shipment">
                      No convoy on the road. The crew will dispatch when cargo,
                      workers and provisions are ready.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <section className="settlements" aria-label="Settlement projects">
          {world.settlements.map((group) => (
            <SettlementCard key={group.id} group={group} />
          ))}
        </section>
        <section className="chronicle" aria-label="World chronicle">
          <div>
            <p className="eyebrow">WHILE YOU WERE AWAY</p>
            <h2>A record of what changed.</h2>
            <p className="field-note">
              Shipments, interventions and milestones. Current choices appear
              above.
            </p>
          </div>
          <ol>
            {world.events
              .filter((event) => event.kind !== "decision")
              .slice(-8)
              .reverse()
              .map((event, index) => (
                <li key={`${event.tick}-${index}`}>
                  <span>DAY {event.tick}</span>
                  <p>{event.text}</p>
                </li>
              ))}
          </ol>
        </section>
      </main>
      <footer>
        <a href={server ? "?mode=server" : "./"}>Play The First Charter</a>
        <span>
          Development scenario ·{" "}
          {server
            ? "Server memory resets when the API restarts."
            : "An isolated world. Reloading starts fresh."}
        </span>
        <span>Renewable food · finite timber and ore</span>
      </footer>
    </div>
  );
}
