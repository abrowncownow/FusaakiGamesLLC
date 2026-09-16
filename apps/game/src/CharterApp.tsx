import { useEffect, useRef, useState } from "react";
import {
  committedRaw,
  createWorld,
  getCharterChoices,
  getCharterSituation,
  representative,
  WORKSHOP_COST,
} from "@fusaakigames/simulation";
import type {
  Command,
  Settlement,
  SettlementId,
  World,
} from "@fusaakigames/simulation";
import { createClient } from "./client";
import { WorldMap } from "./WorldMap";
import "./charter.css";

declare const __BUILD_ID__: string;

function Medallion({ id }: { id: SettlementId }) {
  return (
    <span
      className={`charter-medallion charter-medallion-${id}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1" />
        <circle
          cx="40"
          cy="40"
          r="30"
          stroke="currentColor"
          strokeOpacity=".25"
        />
        {id === "willow" ? (
          <>
            <path
              d="M40 59V24M40 47C24 45 22 33 24 27C35 27 41 35 40 47ZM40 38C50 38 58 28 56 22C46 22 39 28 40 38Z"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M32 59H48"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <path
              d="M26 53L40 23L55 53H26Z"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M23 59H58M32 41L40 46L49 40M40 46V54"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </span>
  );
}

function Community({ group, world }: { group: Settlement; world: World }) {
  const charter = world.charter;
  if (!charter) return null;
  const person = representative(group.id);
  const isPatron = charter.patron === group.id;
  const trust = charter.trust[group.id];
  return (
    <article
      className="charter-community"
      data-testid={`charter-community-${group.id}`}
    >
      <div className="charter-community-heading">
        <Medallion id={group.id} />
        <div>
          <p className="charter-kicker">
            {isPatron ? "YOUR PROMISE" : "YOUR NEIGHBOR"}
          </p>
          <h3>{group.name}</h3>
          <p className="charter-person">{person.name}</p>
        </div>
      </div>
      <div className="charter-relationship">
        <span>
          {trust >= 2
            ? "You have their trust"
            : trust < 0
              ? "Trust damaged"
              : "Trust still to earn"}
        </span>
        <strong>
          {trust} <span>/ 2 needed</span>
        </strong>
      </div>
      {group.workshop.complete ? (
        <p className="charter-built">
          <span aria-hidden="true">✓</span> Workshop built
        </p>
      ) : (
        <div className="charter-materials">
          {(["timber", "ore"] as const).map((resource) => {
            const amount = Math.min(
              WORKSHOP_COST[resource],
              committedRaw(group, resource),
            );
            return (
              <div key={resource}>
                <div className="charter-material-label">
                  <span>{resource} secured</span>
                  <span>
                    {amount}/{WORKSHOP_COST[resource]}
                  </span>
                </div>
                <progress
                  value={amount}
                  max={WORKSHOP_COST[resource]}
                  aria-label={`${group.name} ${resource} secured`}
                />
              </div>
            );
          })}
          <p>
            {group.workshop.work > 0
              ? `Building underway · ${group.workshop.work}/6 work`
              : "Materials still need delivery and construction."}
          </p>
        </div>
      )}
    </article>
  );
}

export function CharterApp() {
  const [server] = useState(
    () => new URLSearchParams(location.search).get("mode") === "server",
  );
  const [client] = useState(() => createClient(server));
  const [world, setWorld] = useState<World>(createWorld);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const shouldFocusReport = useRef(false);
  const reportHeading = useRef<HTMLHeadingElement>(null);

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
          setError("The world could not be reached. Reload to try again.");
      });
    return () => {
      disposed = true;
    };
  }, [client]);

  useEffect(() => {
    if (shouldFocusReport.current) {
      reportHeading.current?.focus();
      shouldFocusReport.current = false;
    }
  }, [world]);

  async function send(command: Command) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await client.send(command);
      shouldFocusReport.current = true;
      setWorld(next);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "That decision could not be completed.";
      try {
        setWorld(await client.read());
        setError(
          `${message} The latest world is shown below; choose your next move.`,
        );
      } catch {
        setError(
          `${message} We could not refresh the world. Reload when your connection returns.`,
        );
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const disabled = busy || !ready;
  const run = world.charter;
  const report = run?.reports.at(-1);
  const patron = run
    ? world.settlements.find((group) => group.id === run.patron)
    : undefined;
  const choices = run && !run.ending ? getCharterChoices(world) : [];
  const labHref = server ? "?view=lab&mode=server" : "?view=lab";
  const start = (id: SettlementId) =>
    void send({ type: "start-charter", patron: id, runId: world.runId });

  return (
    <div className="charter-app">
      <a className="charter-skip" href="#charter-main">
        Skip to the game
      </a>
      <header className="charter-header">
        <a
          className="charter-brand"
          href={server ? "?mode=server" : "./"}
          aria-label="Fusaaki Games, The First Charter"
        >
          <span className="charter-brand-seal" aria-hidden="true">
            F
          </span>
          <span>
            FUSAAKI GAMES<small>A WORLD IN THE MAKING</small>
          </span>
        </a>
        <a className="charter-lab-link" href={labHref}>
          Simulation lab <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="charter-main">
        <div className={`charter-intro ${run ? "charter-intro-active" : ""}`}>
          <div>
            <p className="charter-kicker">A SHORT, PLAYABLE CHAPTER</p>
            <h1>
              The First Charter<span aria-hidden="true">.</span>
            </h1>
            {!run && (
              <p className="charter-lede">
                Two settlements. Twenty-one days.
                <br />
                One promise with your name on it.
              </p>
            )}
          </div>
          {run && (
            <div className="charter-calendar">
              <strong data-testid="charter-day">Day {world.tick}</strong>
              <span>of {run.deadline} · charter hearing</span>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="charter-error">
            {error}
          </p>
        )}

        {!run ? (
          <section className="charter-opening" aria-label="Choose your promise">
            <div className="charter-premise">
              <p>
                You are an independent organizer seeking the council's
                permission to found a guild. Willow and Bracken can vouch for
                you, if you help turn their plans into a working workshop.
              </p>
              <p>
                <strong>
                  Choose a community. Help finish its workshop and earn its
                  trust before day 21.
                </strong>{" "}
                Each decision moves the world forward by up to three days.
              </p>
            </div>
            <div className="charter-sponsors">
              {world.settlements.map((group) => {
                const person = representative(group.id);
                return (
                  <article
                    className={`charter-sponsor charter-sponsor-${group.id}`}
                    key={group.id}
                  >
                    <div className="charter-sponsor-heading">
                      <Medallion id={group.id} />
                      <div>
                        <p className="charter-kicker">{group.name}</p>
                        <h2>{person.name}</h2>
                        <p>{person.role}</p>
                      </div>
                    </div>
                    <blockquote>“{person.quote}”</blockquote>
                    <button
                      className="charter-promise"
                      disabled={disabled}
                      onClick={() => start(group.id)}
                    >
                      {group.id === "willow"
                        ? "Promise Willow"
                        : "Promise Bracken"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </article>
                );
              })}
            </div>
            <p className="charter-opening-note">
              A handful of decisions, then a result. Try another approach on
              your next visit.
            </p>
          </section>
        ) : (
          <>
            <section className="charter-objective" aria-label="Your promise">
              <div>
                <p className="charter-kicker">
                  YOUR PROMISE TO {patron?.name.toUpperCase()}
                </p>
                <p>A working workshop and their trust by day {run.deadline}.</p>
              </div>
              <div className="charter-objective-checks">
                <span
                  className={
                    patron?.workshop.complete ? "charter-check-done" : ""
                  }
                >
                  <span aria-hidden="true">
                    {patron?.workshop.complete ? "✓" : "○"}
                  </span>{" "}
                  Workshop {patron?.workshop.complete ? "built" : "unfinished"}
                </span>
                <span
                  className={
                    run.trust[run.patron] >= 2 ? "charter-check-done" : ""
                  }
                >
                  <span aria-hidden="true">
                    {run.trust[run.patron] >= 2 ? "✓" : "○"}
                  </span>{" "}
                  Trust {run.trust[run.patron]}/2 needed
                </span>
              </div>
            </section>

            <div className="charter-play-layout">
              <div className="charter-story-column">
                {run.ending ? (
                  <section
                    className="charter-ending"
                    data-testid="charter-ending"
                    aria-label="Your charter result"
                  >
                    <p className="charter-kicker">
                      THE HEARING · DAY {world.tick}
                    </p>
                    <h2 tabIndex={-1} ref={reportHeading}>
                      {run.ending.title}
                    </h2>
                    <p>{run.ending.text}</p>
                    <div className="charter-counterfactual">
                      <strong>
                        {run.ending.workshops} workshop
                        {run.ending.workshops === 1 ? "" : "s"} built
                      </strong>
                      <span>
                        The same world without your involvement:{" "}
                        {run.ending.baselineWorkshops}.
                      </span>
                    </div>
                    <p className="charter-impact">
                      You contributed {run.helped.willow + run.helped.bracken}{" "}
                      timber through your own work and supplied{" "}
                      {run.supplied.willow + run.supplied.bracken} carried
                      goods.
                      {run.stolen > 0
                        ? ` You took ${run.stolen} goods from convoys along the way.`
                        : ""}
                    </p>
                    <p className="charter-chapter-end">
                      End of this chapter. Your guild's next step is a future
                      playtest.
                    </p>
                    <div className="charter-replay">
                      <button
                        disabled={disabled}
                        onClick={() => start(run.patron)}
                      >
                        Try another approach <span aria-hidden="true">↻</span>
                      </button>
                      <button
                        disabled={disabled}
                        onClick={() =>
                          start(run.patron === "willow" ? "bracken" : "willow")
                        }
                      >
                        Promise {run.patron === "willow" ? "Bracken" : "Willow"}{" "}
                        instead
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <section
                      className="charter-report"
                      aria-label="Latest report"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <p className="charter-kicker">
                        {report
                          ? `DAYS ${report.fromDay}–${report.toDay} · WORD FROM THE ROAD`
                          : "YOUR STORY STARTS HERE"}
                      </p>
                      <h2 tabIndex={-1} ref={reportHeading}>
                        {report?.title ?? "A promise is a beginning."}
                      </h2>
                      <p>{report?.text ?? getCharterSituation(world)}</p>
                      {report?.reaction && (
                        <blockquote>{report.reaction}</blockquote>
                      )}
                      {report && report.news.length > 0 && (
                        <details className="charter-world-news">
                          <summary>Meanwhile, in the world</summary>
                          <ul>
                            {report.news.map((news, index) => (
                              <li key={index}>{news}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </section>
                    <section
                      className="charter-next"
                      aria-label="Your next move"
                      aria-busy={busy}
                    >
                      <div className="charter-next-heading">
                        <h2>Your next move</h2>
                        <span>
                          {Math.max(0, run.deadline - world.tick)} days left
                        </span>
                      </div>
                      {report && (
                        <p className="charter-situation">
                          {getCharterSituation(world)}
                        </p>
                      )}
                      <div className="charter-choice-list">
                        {choices.map((choice, index) => (
                          <button
                            key={choice.id}
                            className={`charter-choice charter-choice-${choice.tone}`}
                            data-testid={`choice-${choice.id}`}
                            aria-label={choice.title}
                            disabled={disabled}
                            onClick={() =>
                              void send({
                                type: "charter-choice",
                                runId: world.runId,
                                revision: run.revision,
                                choice: choice.id,
                              })
                            }
                          >
                            <span
                              className="charter-choice-number"
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="charter-choice-copy">
                              <strong>{choice.title}</strong>
                              <span>{choice.description}</span>
                              <small>{choice.cost}</small>
                            </span>
                            <span
                              className="charter-choice-arrow"
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="charter-choice-note" role="status">
                        {busy
                          ? "Your decision is changing the world…"
                          : "Choose one. Both crews keep working while time passes."}
                      </p>
                    </section>
                  </>
                )}
                <details className="charter-journal">
                  <summary>
                    Your journey
                    {run.reports.length > 0
                      ? ` · ${run.reports.length} ${run.reports.length === 1 ? "decision" : "decisions"}`
                      : ""}
                  </summary>
                  {run.reports.length === 0 ? (
                    <p>You have made a promise. The rest is unwritten.</p>
                  ) : (
                    <ol>
                      {[...run.reports].reverse().map((entry) => (
                        <li key={entry.revision}>
                          <span>DAY {entry.toDay}</span>
                          <div>
                            <h3>{entry.title}</h3>
                            <p>{entry.text}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </details>
              </div>
              <aside
                className="charter-world-column"
                aria-label="The two communities"
              >
                {world.settlements.map((group) => (
                  <Community key={group.id} group={group} world={world} />
                ))}
                <details className="charter-world-detail">
                  <summary>A look around</summary>
                  <WorldMap groups={world.settlements} />
                  <p>
                    Each settlement makes its own plans. Secured materials may
                    still be at the source or on the road.
                  </p>
                </details>
                <details className="charter-rules">
                  <summary>How your promise works</summary>
                  <p>
                    You need a finished workshop and at least 2 trust with your
                    chosen community at the day {run.deadline} hearing.
                  </p>
                  <p>
                    A productive timber shift earns 1 trust. Supplies can earn
                    trust too. Trust is a relationship score, with a maximum of
                    5; you cannot spend it. Your choices show their time and
                    resource costs.
                  </p>
                  <p>
                    The other community matters too. Helping both can earn a
                    shared future; harming your neighbor has consequences.
                  </p>
                  <p>
                    Your pack: {world.player.inventory.food} rations,{" "}
                    {world.player.inventory.timber} timber,{" "}
                    {world.player.inventory.ore} ore.
                  </p>
                </details>
              </aside>
            </div>
          </>
        )}
      </main>
      <footer className="charter-footer">
        <p>
          {server
            ? "Local shared world · resets when the server restarts."
            : "Your own browser world · reloading starts fresh."}
        </p>
        <span>EARLY PLAYTEST · {__BUILD_ID__}</span>
      </footer>
    </div>
  );
}
