import { useEffect, useRef, useState } from "react";
import {
  createWorld,
  reasonFor,
  TIMBER_REQUIRED,
} from "@fusaakigames/simulation";
import type {
  Command,
  Profile,
  Settlement,
  World,
} from "@fusaakigames/simulation";
import { createClient } from "./client";

declare const __BUILD_ID__: string;

function WorldMap({ groups }: { groups: Settlement[] }) {
  return (
    <svg
      className="world-map"
      viewBox="0 0 800 380"
      role="img"
      aria-label="Willow village and Bracken camp connected to a timber forest"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#d4ddc8"
            strokeWidth="0.6"
          />
        </pattern>
        <linearGradient id="land" x2="0.6" y2="1">
          <stop stopColor="#e1e9d5" />
          <stop offset="1" stopColor="#c9d6bb" />
        </linearGradient>
      </defs>
      <rect width="800" height="380" fill="url(#land)" />
      <rect width="800" height="380" fill="url(#grid)" />
      <path
        d="M 550 -10 C 455 50 600 116 540 177 S 447 284 525 400"
        fill="none"
        stroke="#adcbc5"
        strokeWidth="34"
      />
      <path
        d="M 165 240 Q 260 310 388 138 Q 445 230 640 247"
        fill="none"
        stroke="#b8a78b"
        strokeWidth="10"
      />
      <path
        d="M 165 240 Q 260 310 388 138 Q 445 230 640 247"
        fill="none"
        stroke="#ece1c9"
        strokeWidth="5"
        strokeDasharray="9 6"
      />
      {[330, 370, 410, 450, 345, 390, 430].map((x, index) => (
        <g key={x} transform={`translate(${x},${index < 4 ? 87 : 115})`}>
          <rect x="-3" y="0" width="6" height="28" fill="#75664d" />
          <path
            d="M 0 -35 L 20 12 L -20 12 Z"
            fill={index % 2 ? "#547158" : "#3e5f4c"}
          />
        </g>
      ))}
      <text x="390" y="42" textAnchor="middle" className="map-label">
        THE COMMON WOOD
      </text>
      {groups.map((group, index) => {
        const x = index === 0 ? 165 : 640;
        const color = index === 0 ? "#9a6551" : "#63764f";
        const progress =
          group.stage === "transporting" ? (3 - group.travelRemaining) / 3 : 0;
        return (
          <g key={group.id}>
            <ellipse cx={x} cy="247" rx="66" ry="28" fill="#afbf9c" />
            {[-25, 12].map((dx) => (
              <g key={dx} transform={`translate(${x + dx},220)`}>
                <rect width="27" height="30" fill="#f2e8d5" />
                <path d="M -5 0 L 14 -21 L 32 0 Z" fill={color} />
                <rect x="10" y="15" width="8" height="15" fill="#726653" />
              </g>
            ))}
            {group.stage === "complete" && (
              <g transform={`translate(${x - 8},183)`}>
                <rect width="35" height="26" fill="#f4e9d0" />
                <path d="M -4 0 L 17 -15 L 39 0 Z" fill="#bb873e" />
              </g>
            )}
            <text x={x} y="301" textAnchor="middle" className="map-label">
              {group.name.toUpperCase()}
            </text>
            <text x={x} y="323" textAnchor="middle" className="map-detail">
              {index === 0 ? "Human settlement" : "Goblin settlement"}
            </text>
            {group.stage === "transporting" && (
              <g
                transform={`translate(${390 + (x - 390) * progress},${145 + 90 * progress})`}
              >
                <circle
                  r="13"
                  fill="#263e35"
                  stroke="#f8e5b4"
                  strokeWidth="3"
                />
                <text y="5" textAnchor="middle" fill="white" fontSize="13">
                  {group.cargo}
                </text>
              </g>
            )}
          </g>
        );
      })}
      <text x="752" y="43" className="map-label">
        N ↑
      </text>
    </svg>
  );
}

export function App() {
  const [server] = useState(
    () => new URLSearchParams(location.search).get("mode") === "server",
  );
  const [client] = useState(() => createClient(server));
  const [world, setWorld] = useState<World>(createWorld);
  const [profile, setProfile] = useState<Profile>("novice");
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
  const completed = world.settlements.filter(
    (group) => group.stage === "complete",
  ).length;
  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="./">
          <span className="crest" aria-hidden="true">
            F
          </span>
          <span>
            FUSAAKI<span className="wordmark-small">GAMES · WORLD LAB</span>
          </span>
        </a>
        <span className="build-label">
          <span className="status-dot" /> FOUNDATION BUILD · {__BUILD_ID__}
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
            SCENARIO 01<span>The timber requisition</span>
          </div>
        </div>
        <div className="workspace">
          <section className="world-panel" aria-label="World overview">
            <div className="panel-heading">
              <div>
                <span className="status-dot" />{" "}
                {server ? "LOCAL SERVER WORLD" : "YOUR BROWSER SANDBOX"}
              </div>
              <span data-testid="world-tick">Day {world.tick}</span>
            </div>
            <WorldMap groups={world.settlements} />
            <div className="world-stats">
              <div>
                <span>Standing timber</span>
                <strong>{world.forestTimber}</strong>
              </div>
              <div>
                <span>NPC workers</span>
                <strong>4</strong>
              </div>
              <div>
                <span>Workshops built</span>
                <strong>
                  {completed} <small>/ 2</small>
                </strong>
              </div>
            </div>
            <div className="time-controls">
              <span>Advance the scenario</span>
              <button
                disabled={disabled}
                onClick={() => void send({ type: "advance", steps: 1 })}
              >
                +1 day
              </button>
              <button
                className="primary"
                disabled={disabled}
                onClick={() => void send({ type: "advance", steps: 10 })}
              >
                +10 days <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
          <aside
            className="participation-panel"
            aria-label="Player participation"
          >
            <p className="eyebrow">MAKE A DIFFERENCE</p>
            <h2>Lend the crew a hand.</h2>
            <p>
              Both settlements need timber for a workshop. Their NPC crews will
              complete the work on their own. Your help brings it closer.
            </p>
            <label htmlFor="profile">Test character</label>
            <select
              id="profile"
              value={profile}
              disabled={disabled || world.player !== null}
              onChange={(event) => setProfile(event.target.value as Profile)}
            >
              <option value="novice">New harvester · 2 timber / day</option>
              <option value="skilled">
                Skilled harvester · 4 timber / day
              </option>
            </select>
            <p className="field-note">
              Each NPC gathers 1 timber per day. Character presets let us
              compare progression.
            </p>
            <button
              className="primary join-button"
              disabled={
                disabled ||
                world.settlements[0]?.stage !== "harvesting" ||
                world.player?.settlementId === "willow"
              }
              onClick={() =>
                void send({ type: "join", settlementId: "willow", profile })
              }
            >
              {world.player?.settlementId === "willow"
                ? "Working with Willow"
                : "Join Willow crew"}
            </button>
            <button
              className="leave-button"
              disabled={disabled || world.player === null}
              onClick={() => void send({ type: "leave" })}
            >
              Leave the crew
            </button>
            <div className="participation-note">
              <span aria-hidden="true">↗</span>
              <p>
                Compare Willow's progress with Bracken. Completed work stays
                with the project when you leave.
              </p>
            </div>
          </aside>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <section className="settlements" aria-label="Settlement projects">
          {world.settlements.map((group) => {
            const amount =
              group.timberAtForest +
              group.cargo +
              group.timberAtHome +
              group.timberUsed;
            return (
              <article
                className="settlement-card"
                key={group.id}
                data-testid={`settlement-${group.id}`}
              >
                <div className="card-title">
                  <h2>{group.name}</h2>
                  <span className={`stage stage-${group.stage}`}>
                    {group.stage}
                  </span>
                </div>
                <p>{reasonFor(group)}</p>
                <div className="progress-caption">
                  <span>Workshop timber</span>
                  <strong>
                    {amount} / {TIMBER_REQUIRED}
                  </strong>
                </div>
                <progress
                  value={amount}
                  max={TIMBER_REQUIRED}
                  aria-label={`${group.name} workshop timber`}
                />
                <div className="inventory-line">
                  <span>
                    At forest{" "}
                    <b data-testid={`${group.id}-forest`}>
                      {group.timberAtForest}
                    </b>
                  </span>
                  <span>
                    In transit <b>{group.cargo}</b>
                  </span>
                  <span>
                    At home <b>{group.timberAtHome}</b>
                  </span>
                  <span>
                    Used <b>{group.timberUsed}</b>
                  </span>
                </div>
              </article>
            );
          })}
        </section>
        <section className="chronicle" aria-label="World chronicle">
          <div>
            <p className="eyebrow">WHILE YOU WERE AWAY</p>
            <h2>A record of what changed.</h2>
          </div>
          <ol>
            {world.events
              .slice(-6)
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
        <span>
          Development scenario ·{" "}
          {server
            ? "Server memory resets when the API restarts."
            : "An isolated world. Reloading starts fresh."}
        </span>
        <button
          disabled={disabled}
          onClick={() => void send({ type: "reset" })}
        >
          Reset scenario
        </button>
      </footer>
    </div>
  );
}
