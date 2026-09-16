import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import {
  TRAVEL_DAYS,
  type JourneyPlaceId,
  type Settlement,
  type World,
} from "@fusaakigames/simulation";
import "./valley-scene.css";

type Point = { x: number; y: number };

const places: Record<JourneyPlaceId, Point & { name: string }> = {
  wood: { x: 320, y: 235, name: "Common Wood" },
  willow: { x: 220, y: 475, name: "Willow" },
  bracken: { x: 750, y: 460, name: "Bracken" },
  mine: { x: 740, y: 170, name: "Grey Ridge Mine" },
  ruins: { x: 450, y: 95, name: "Old Lookout" },
};

// These are the same physical roads used by the journey. Cargo follows them
// too, including the mine's connection through the wood to either village.
const woodWillow: Point[] = [
  places.wood,
  { x: 286, y: 299 },
  { x: 284, y: 354 },
  { x: 249, y: 411 },
  places.willow,
];
const woodBracken: Point[] = [
  places.wood,
  { x: 397, y: 259 },
  { x: 454, y: 301 },
  { x: 560, y: 327 },
  { x: 645, y: 375 },
  { x: 684, y: 427 },
  places.bracken,
];
const woodMine: Point[] = [
  places.wood,
  { x: 410, y: 228 },
  { x: 482, y: 245 },
  { x: 560, y: 225 },
  { x: 635, y: 207 },
  places.mine,
];
const mineRuins: Point[] = [
  places.mine,
  { x: 699, y: 123 },
  { x: 627, y: 97 },
  { x: 554, y: 73 },
  places.ruins,
];
const oldTrail: Point[] = [
  places.ruins,
  { x: 358, y: 104 },
  { x: 254, y: 125 },
  { x: 181, y: 209 },
  { x: 160, y: 331 },
  places.willow,
];

function line(points: Point[]) {
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

function along(points: Point[], progress: number): Point {
  const segments = points.slice(1).flatMap((end, index) => {
    const start = points[index];
    return start
      ? [{ start, end, length: Math.hypot(end.x - start.x, end.y - start.y) }]
      : [];
  });
  let remaining =
    segments.reduce((sum, segment) => sum + segment.length, 0) * progress;
  for (const { start, end, length } of segments) {
    if (remaining <= length) {
      const fraction = length === 0 ? 0 : remaining / length;
      return {
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction,
      };
    }
    remaining -= length;
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

function Hut({ x, y, green = false }: Point & { green?: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cy="20" rx="39" ry="13" fill="#314d39" opacity=".16" />
      <path d="M-29-5 4 8 4 36-29 23Z" fill="#e7d6aa" />
      <path d="M4 8 30-5 30 22 4 36Z" fill="#bdae83" />
      <path d="M-36-7-13-36 24-23 5 13Z" fill={green ? "#62815e" : "#ab6951"} />
      <path d="M5 13 24-23 37-8Z" fill={green ? "#3e624e" : "#754f41"} />
      <path d="M-11 13-2 17-2 32-11 28Z" fill="#67513d" />
      <path d="M12 13 21 9 21 18 12 22Z" fill="#725c44" />
      <path
        d="M-26-9 7 4M-21-17 13-4M-16-25 18-13"
        stroke="#fff1c5"
        opacity=".17"
      />
    </g>
  );
}

function Workshop({ group }: { group: Settlement }) {
  const { x, y } = places[group.id];
  return (
    <g transform={`translate(${x + 39},${y - 75})`}>
      <ellipse cy="12" rx="46" ry="22" fill="#607454" opacity=".22" />
      <path d="M-35-5 6-24 43-6 3 15Z" fill="#b1aa85" />
      {group.workshop.complete ? (
        <>
          <path d="M-35-5 3 11 3 38-35 21Z" fill="#e8d3a2" />
          <path d="M3 11 43-6 43 22 3 38Z" fill="#b7a578" />
          <path d="M-42-9-7-42 48-16 5 14Z" fill="#c79246" />
          <path d="M5 14 48-16 49-5 5 24Z" fill="#8c622e" />
          <path d="M18 23 34 16 34 27 18 34Z" fill="#514938" />
          <rect x="23" y="-39" width="12" height="25" fill="#817761" />
          <path className="valley-smoke" d="M29-44Q18-57 29-69T29-95" />
        </>
      ) : (
        <>
          <path
            d="M-35 20V-31L3-15V39M3-15 43-32V22M-35-31-2-53 43-32M-2-53V-24M-35 7 3-8 43 7"
            fill="none"
            stroke="#856446"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M-22 22-22-18M-12 26-12-14M-24 1-10 6M-24 13-10 18"
            fill="none"
            stroke="#c8ac72"
            strokeWidth="3"
          />
          <path d="M12 22 29 14 43 20 25 28Z" fill="#b6945d" />
        </>
      )}
    </g>
  );
}

function Villagers({ group }: { group: Settlement }) {
  const home = places[group.id];
  const action = group.plan.chosen.action;
  const work =
    action.type === "gather"
      ? places[action.resource === "timber" ? "wood" : "mine"]
      : { x: home.x + 34, y: home.y - 59 };
  const offset = group.id === "willow" ? -28 : 25;
  const rows = [
    {
      amount: group.plan.workers.foraging,
      x: home.x - 80,
      y: home.y - 5,
      task: "foraging",
    },
    {
      amount: group.plan.workers.production,
      x: work.x + offset,
      y: work.y + 25,
      task: action.type,
    },
    {
      amount: group.plan.workers.resting,
      x: home.x + 21,
      y: home.y + 10,
      task: "resting",
    },
  ];
  return (
    <g aria-hidden="true">
      {rows.flatMap(({ amount, x, y, task }) =>
        Array.from({ length: Math.min(amount, 3) }, (_, index) => (
          <g
            key={`${task}-${index}`}
            transform={`translate(${x + index * 14},${y + (index % 2) * 8})`}
          >
            <g
              className={task === "resting" ? "" : "valley-worker"}
              style={{ animationDelay: `${index * -0.7}s` }}
            >
              <ellipse cy="7" rx="6" ry="3" fill="#314935" opacity=".2" />
              <path
                d="M-4-4Q0-8 4-4L5 6H-5Z"
                fill={group.id === "willow" ? "#b2704f" : "#4f6953"}
              />
              <circle
                cy="-9"
                r="4"
                fill={group.id === "willow" ? "#e1bd85" : "#adbf82"}
              />
              {task === "gather" && (
                <path
                  d="M5 2 11-11M8-10 14-9"
                  stroke="#66563c"
                  strokeWidth="2"
                />
              )}
              {task === "foraging" && (
                <ellipse cx="7" cy="3" rx="4" ry="3" fill="#ae8652" />
              )}
            </g>
          </g>
        )),
      )}
    </g>
  );
}

function Cargo({ group, index }: { group: Settlement; index: number }) {
  const convoy = group.convoy;
  if (!convoy) return null;
  const destination = group.id === "willow" ? woodWillow : woodBracken;
  const route =
    convoy.resource === "ore"
      ? [...woodMine].reverse().concat(destination.slice(1))
      : destination;
  const progress = Math.max(
    0,
    Math.min(1, (TRAVEL_DAYS - convoy.travelRemaining) / TRAVEL_DAYS),
  );
  const point = along(route, progress);
  const description = `${group.name} convoy: ${convoy.amount} ${convoy.resource}, ${convoy.escorts} escorts, ${convoy.travelRemaining} days to arrival`;
  return (
    <g
      className="valley-convoy"
      transform={`translate(${point.x + index * 15},${point.y - 14 - index * 8})`}
      role="img"
      aria-label={description}
    >
      <title>{description}</title>
      <ellipse cy="17" rx="22" ry="8" fill="#344c39" opacity=".2" />
      <path d="M-17-4 5-13 22-5 0 5Z" fill="#dac49a" />
      <path d="M-17-4 0 5V20L-17 11Z" fill="#906945" />
      <path d="M0 5 22-5V10L0 20Z" fill="#b08b58" />
      <circle
        cx="-10"
        cy="14"
        r="6"
        fill="#4c493a"
        stroke="#d1bc8b"
        strokeWidth="2"
      />
      <circle
        cx="15"
        cy="14"
        r="6"
        fill="#4c493a"
        stroke="#d1bc8b"
        strokeWidth="2"
      />
      {convoy.resource === "timber" ? (
        <path
          d="M-13-5 5-13M-7-1 12-10M0 1 18-7"
          stroke="#855c37"
          strokeWidth="5"
          strokeLinecap="round"
        />
      ) : (
        <path d="M-12-5-5-13 2-10 7-16 16-8 4-2Z" fill="#7b8690" />
      )}
      <path d="M-19 2-28-3" stroke="#745e40" strokeWidth="3" />
      <circle cx="-30" cy="-10" r="4" fill="#e4c290" />
      <path
        d="M-34-6H-27L-25 4H-34Z"
        fill={group.id === "willow" ? "#ac654f" : "#4b6850"}
      />
    </g>
  );
}

export function ValleyScene({
  world,
  selected,
  onSelect,
  traveling = false,
}: {
  world: World;
  selected: JourneyPlaceId;
  onSelect: (id: JourneyPlaceId) => void;
  traveling?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const location = world.journey?.location ?? "wood";
  const player = places[location];
  const playerElement = useRef<SVGGElement>(null);
  const previousPlace = useRef(location);
  useLayoutEffect(() => {
    const from = previousPlace.current;
    previousPlace.current = location;
    if (
      from === location ||
      !traveling ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const road = [woodWillow, woodBracken, woodMine, mineRuins, oldTrail].find(
      (route) =>
        (route[0] === places[from] && route.at(-1) === places[location]) ||
        (route[0] === places[location] && route.at(-1) === places[from]),
    );
    if (!road) return;
    const path = road[0] === places[from] ? road : [...road].reverse();
    const frames = Array.from({ length: 31 }, (_, index) => {
      const point = along(path, index / 30);
      return { transform: `translate(${point.x + 30}px, ${point.y + 15}px)` };
    });
    const animation = playerElement.current?.animate(frames, {
      duration: 780,
      easing: "linear",
    });
    return () => animation?.cancel();
  }, [location, traveling]);
  const visited = world.journey?.visited ?? ["wood"];
  const forest = Array.from({ length: 93 }, (_, index) => {
    const x = 43 + ((index * 137 + 19) % 897);
    const y = 48 + ((index * 79 + 37) % 560);
    // Leave clearings around destinations and keep trees off the river/roads.
    if (
      Object.values(places).some(
        (place) => Math.hypot(x - place.x, (y - place.y) * 1.2) < 104,
      )
    )
      return null;
    if (x > 492 && x < 626) return null;
    if (y > 215 && y < 271 && x > 300) return null;
    if (x > 265 && x < 310 && y > 250) return null;
    if (x > 365 && y > 270 && y < 420 && x < 710) return null;
    return { x, y, scale: 0.8 + (index % 5) * 0.08, pine: index % 3 !== 0 };
  })
    .filter((tree) => tree !== null)
    .sort((a, b) => a.y - b.y);
  const river =
    "M610-35C538 26 587 91 568 148S554 236 572 282S516 350 508 407 480 472 486 526 420 601 422 687";
  return (
    <div className="valley-scene" data-traveling={traveling}>
      <svg
        className="valley-scene-art"
        viewBox="0 0 1000 650"
        aria-label="Explore the valley. Select a place to inspect it; choose Travel in the place panel to go there."
      >
        <defs>
          <linearGradient id={`${id}-land`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#9bb589" />
            <stop offset=".55" stopColor="#c0ca96" />
            <stop offset="1" stopColor="#a8bd86" />
          </linearGradient>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#658f94" />
            <stop offset="1" stopColor="#8eb7af" />
          </linearGradient>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#fff2bb" stopOpacity=".22" />
            <stop offset="1" stopColor="#fff2bb" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={`${id}-grass`}
            width="67"
            height="53"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m8 12-2-4m2 4 3-3m31 24-2-5m2 5 4-2"
              fill="none"
              stroke="#65854e"
              strokeWidth="1.3"
              opacity=".19"
            />
            <circle cx="51" cy="10" r="1.4" fill="#edf0bd" opacity=".45" />
          </pattern>
          <g id={`${id}-pine`}>
            <ellipse cy="11" rx="24" ry="10" fill="#344e37" opacity=".14" />
            <path d="M-3-15H4V13H-3Z" fill="#7b6b45" />
            <path
              d="M0-63-22-18H-15L-29 3Q0 15 29 3L15-18H22Z"
              fill="#4e7958"
            />
            <path d="M0-63V7Q-19 7-29 3L-15-18H-22Z" fill="#648b62" />
            <path
              d="M0-42 14-15M0-23 19 0"
              stroke="#416b51"
              strokeWidth="2"
              opacity=".45"
            />
          </g>
          <g id={`${id}-tree`}>
            <ellipse cy="12" rx="26" ry="11" fill="#344e37" opacity=".14" />
            <path d="M-3-17H4V14H-3Z" fill="#81724b" />
            <path d="M0-12-12-28M1-20 13-35" stroke="#81724b" strokeWidth="4" />
            <path
              d="M-26-25Q-37-44-18-49-13-72 10-59 35-61 31-36 44-19 22-10 8 0-7-9-26-4-26-25"
              fill="#809a61"
            />
            <path
              d="M-26-25Q-37-44-18-49-13-72 10-59 1-41-8-34-20-26-26-25"
              fill="#94ae70"
            />
            <path
              d="M4-31Q17-19 30-31"
              fill="none"
              stroke="#6e8958"
              strokeWidth="3"
            />
          </g>
          <g id={`${id}-bush`}>
            <path
              d="M-17 5Q-24-10-10-10-3-25 8-11 24-13 21 4Z"
              fill="#6c915c"
            />
            <circle cx="-8" cy="-3" r="2" fill="#ce925e" />
            <circle cx="8" cy="-4" r="2" fill="#ce925e" />
          </g>
        </defs>
        <g aria-hidden="true">
          <rect width="1000" height="650" fill={`url(#${id}-land)`} />
          <path
            d="M0 0H1000V75Q868 16 804 83T641 123Q613 57 518 107T327 114 154 189 0 112Z"
            fill="#72946e"
            opacity=".32"
          />
          <path
            d="M598 0H1000V259Q903 207 854 234T700 264Q734 227 662 174T598 0Z"
            fill="#9ba88a"
          />
          <path
            d="M652 0H1000V142Q913 138 861 171T725 184Q750 115 701 89T652 0"
            fill="#8f9a83"
          />
          <path
            d="M687 0H1000V81Q891 66 839 106T744 118Q773 65 687 0Z"
            fill="#abb29b"
          />
          <path
            d="M0 557Q155 487 302 560T559 615 792 545 1000 567V650H0Z"
            fill="#799f6b"
            opacity=".3"
          />
          <path
            d="M15 350Q97 327 111 390T80 482M834 566Q890 485 978 487M54 76Q117 31 234 58"
            fill="none"
            stroke="#728f5e"
            strokeWidth="2"
            opacity=".28"
          />
          <rect width="1000" height="650" fill={`url(#${id}-grass)`} />
          <path d={river} fill="none" stroke="#829c77" strokeWidth="54" />
          <path d={river} fill="none" stroke="#ced1a5" strokeWidth="45" />
          <path
            d={river}
            fill="none"
            stroke={`url(#${id}-water)`}
            strokeWidth="34"
          />
          <path
            d={river}
            fill="none"
            stroke="#cce5cd"
            strokeWidth="2"
            strokeDasharray="11 53 31 75"
            opacity=".65"
            className="valley-river"
          />
          {[woodWillow, woodBracken, woodMine, mineRuins].map((road, index) => (
            <g key={index}>
              <polyline
                points={line(road)}
                fill="none"
                stroke="#91a270"
                strokeWidth="20"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                points={line(road)}
                fill="none"
                stroke="#d7cc9d"
                strokeWidth="13"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                points={line(road)}
                fill="none"
                stroke="#eee0b1"
                strokeWidth="2"
                strokeDasharray="1 18"
                strokeLinecap="round"
              />
            </g>
          ))}
          {world.journey?.discovery && (
            <polyline
              className="valley-discovered-trail"
              points={line(oldTrail)}
              fill="none"
              stroke="#ead4a0"
              strokeWidth="7"
              strokeDasharray="9 7"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {[
            { x: 556, y: 228, angle: -14 },
            { x: 552, y: 324, angle: 14 },
            { x: 566, y: 77, angle: 18 },
          ].map((bridge) => (
            <g
              key={bridge.y}
              transform={`translate(${bridge.x},${bridge.y}) rotate(${bridge.angle})`}
            >
              <rect
                x="-30"
                y="-13"
                width="60"
                height="26"
                rx="2"
                fill="#806b48"
              />
              <path
                d="M-25-11V11M-17-11V11M-9-11V11M-1-11V11M7-11V11M15-11V11M23-11V11"
                stroke="#b59b66"
                strokeWidth="6"
              />
              <path d="M-33-15H33M-33 15H33" stroke="#68573e" strokeWidth="4" />
            </g>
          ))}
          {forest.map((tree, index) => (
            <use
              key={index}
              href={`#${id}-${tree.pine ? "pine" : "tree"}`}
              transform={`translate(${tree.x},${tree.y}) scale(${tree.scale})`}
            />
          ))}
          <ellipse cx="315" cy="229" rx="77" ry="33" fill="#cbd1a0" />
          <use
            href={`#${id}-pine`}
            transform="translate(274,190) scale(1.17)"
          />
          <use
            href={`#${id}-pine`}
            transform="translate(321,170) scale(1.38)"
          />
          <use href={`#${id}-tree`} transform="translate(366,198) scale(1.1)" />
          <g transform="translate(297,236)">
            <ellipse cy="5" rx="18" ry="8" fill="#b69861" />
            <path d="M-18-5V5Q0 16 18 5V-5" fill="#8b7047" />
            <ellipse cy="-5" rx="18" ry="8" fill="#d4b77a" />
            <ellipse cy="-5" rx="10" ry="4" fill="none" stroke="#a68b58" />
            <path d="M2-5 13-29" stroke="#68513a" strokeWidth="5" />
            <path d="M10-28 21-28 24-19 15-19Z" fill="#82938b" />
          </g>
          <path
            d="m356 225 22-11m-24 18 22-11m-23 18 22-11"
            stroke="#8d7048"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M231 199 247 168 270 209Z" fill="#dbc69a" />
          <path d="M247 168 270 185 283 214 270 209Z" fill="#b49b71" />
          <path d="M245 184 254 204 239 200Z" fill="#7c7254" />
          <g transform="translate(740,155)">
            <path
              d="M-69 0-52-34-17-40 4-65 32-45 53-43 71-12 49 18-31 23Z"
              fill="#737f76"
            />
            <path
              d="M-69 0-52-34-17-40 4-65 9-24-22-14-31 23Z"
              fill="#909b8a"
            />
            <path d="M-21 8V-11Q0-42 21-11V8Z" fill="#394b43" />
            <path
              d="M-25 10V-18H24V10M-27-17 27-17"
              fill="none"
              stroke="#aa9466"
              strokeWidth="6"
            />
            <path
              d="M-13 10-35 46M11 10-8 51M-18 20 7 24M-25 31 1 37M-30 42-4 47"
              stroke="#787460"
              strokeWidth="3"
            />
            <path d="M25 29 39 20 54 27 40 36Z" fill="#aaa987" />
            <path d="M25 29 40 36V47L25 40Z" fill="#736948" />
            <path d="M40 36 54 27V38L40 47Z" fill="#90815a" />
            <circle cx="31" cy="42" r="4" fill="#48564a" />
            <circle cx="47" cy="42" r="4" fill="#48564a" />
          </g>
          <g transform="translate(450,74)">
            <ellipse cy="25" rx="60" ry="24" fill="#899c79" />
            <path
              d="M-32 16-25-31-7-37 12-34 30-23 33 18 5 30Z"
              fill="#a7aa8b"
            />
            <path d="M5-33 30-23 33 18 5 30Z" fill="#818f79" />
            <path
              d="M-25-31V-46L-11-49V-36L0-39V-53L15-47V-32L30-23V-37L39-30 33 18"
              fill="#a7aa8b"
            />
            <path d="M-8 24V5Q2-12 11 0V26" fill="#526953" />
            <path
              d="M-24-14 0-6M-29 3-9 10M13-13 31-7M16 8 32 12M-15-28V-12M-21-10V3"
              stroke="#858f75"
              strokeWidth="2"
            />
            <path
              d="M-39 18-31 8-22 16-26 29ZM34 24 42 11 52 21 46 30Z"
              fill="#bbc0a0"
            />
            <path
              d="M-28-12Q-37-3-31 17M-25-13Q-20-26-15-29"
              fill="none"
              stroke="#6c8d5c"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          {world.settlements.map((group) => {
            const point = places[group.id];
            return (
              <g key={group.id}>
                <ellipse
                  cx={point.x}
                  cy={point.y - 15}
                  rx="108"
                  ry="66"
                  fill="#b6c192"
                />
                <ellipse
                  cx={point.x}
                  cy={point.y + 4}
                  rx="73"
                  ry="34"
                  fill="#cecea1"
                />
                <path
                  d={`M${point.x - 98} ${point.y + 15}v-27m0 7 37 13m-18-6v-20m18 26v-20`}
                  stroke="#9b885c"
                  strokeWidth="4"
                  fill="none"
                />
                <Hut
                  x={point.x - 41}
                  y={point.y - 50}
                  green={group.id === "bracken"}
                />
                <Workshop group={group} />
                <Hut
                  x={point.x + 71}
                  y={point.y + 10}
                  green={group.id === "bracken"}
                />
                <use href={`#${id}-bush`} x={point.x - 84} y={point.y - 18} />
                <use href={`#${id}-bush`} x={point.x - 108} y={point.y + 9} />
                <g transform={`translate(${point.x - 8},${point.y + 5})`}>
                  <ellipse cy="5" rx="13" ry="7" fill="#aaa384" />
                  <path d="M-10 1-4-10 5-12 12 0 8 8-7 8Z" fill="#d4c69a" />
                  <ellipse cy="-2" rx="8" ry="5" fill="#687d70" />
                  <path
                    d="M-14-2V-28H15V-2M0-28V-7"
                    stroke="#8a7956"
                    strokeWidth="3"
                  />
                </g>
              </g>
            );
          })}
          {[
            { x: 532, y: 411 },
            { x: 458, y: 530 },
            { x: 605, y: 30 },
            { x: 540, y: 135 },
          ].map((reed) => (
            <path
              key={reed.y}
              d={`M${reed.x} ${reed.y}v-17m0 17-6-13m6 13 5-20m-1 21 7-9`}
              stroke="#6e8b59"
              strokeWidth="2"
            />
          ))}
          <ellipse
            cx="358"
            cy="222"
            rx="421"
            ry="330"
            fill={`url(#${id}-light)`}
          />
        </g>
        {world.settlements.map((group) => (
          <Villagers key={group.id} group={group} />
        ))}
        {world.settlements.map((group, index) => (
          <Cargo
            key={group.convoy?.id ?? group.id}
            group={group}
            index={index}
          />
        ))}
        {(
          Object.entries(places) as [
            JourneyPlaceId,
            (typeof places)[JourneyPlaceId],
          ][]
        ).map(([placeId, place]) => {
          const here = location === placeId;
          const seen = visited.includes(placeId);
          return (
            <g
              key={placeId}
              className="valley-place"
              role="button"
              tabIndex={0}
              aria-label={`${place.name}${here ? ", you are here" : seen ? ", visited" : ", unexplored"}. Inspect place`}
              aria-pressed={selected === placeId}
              onClick={() => onSelect(placeId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(placeId);
                }
              }}
            >
              <ellipse
                className="valley-place-ring"
                cx={place.x}
                cy={place.y + 4}
                rx="68"
                ry="30"
              />
              <ellipse
                className="valley-place-target"
                cx={place.x}
                cy={place.y}
                rx="87"
                ry="75"
              />
            </g>
          );
        })}
        <g
          className="valley-player"
          ref={playerElement}
          style={{
            transform: `translate(${player.x + 30}px, ${player.y + 15}px)`,
          }}
          aria-hidden="true"
        >
          <ellipse cy="10" rx="19" ry="9" fill="#304b37" opacity=".3" />
          <ellipse
            cy="9"
            rx="24"
            ry="13"
            fill="none"
            stroke="#fff8ce"
            strokeWidth="3"
          />
          <g className="valley-player-body">
            <path
              d="M-6-22 8-19 14 7Q1 15-13 5Z"
              fill="#b64f3c"
              stroke="#783d32"
              strokeWidth="1.4"
            />
            <path
              d="M-3 2-4 11M5 2 8 11"
              stroke="#4d5140"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M-4-18H6L8 0H-6Z" fill="#ebc98e" />
            <path
              d="M-7-16-14-4M8-16 13-5"
              stroke="#b5895d"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cy="-28" r="8" fill="#e9bd81" />
            <path d="M-9-29Q-8-42 4-35L11-28Q0-32-9-26Z" fill="#3d5347" />
            <path
              d="M13-13 16 12"
              stroke="#675743"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M-5-18 7-6" stroke="#72543e" strokeWidth="3" />
          </g>
        </g>
        <g
          aria-hidden="true"
          className="valley-compass"
          transform="translate(945,588)"
        >
          <path d="M0-25 7-4 0-9-7-4Z" fill="#4f6a50" />
          <path d="M0 18-7-4 0 0 7-4Z" fill="#8b9f75" />
          <text y="-34" textAnchor="middle">
            N
          </text>
        </g>
      </svg>
      <div className="valley-place-labels" aria-hidden="true">
        {(
          Object.entries(places) as [
            JourneyPlaceId,
            (typeof places)[JourneyPlaceId],
          ][]
        ).map(([placeId, place]) => (
          <div
            key={placeId}
            className="valley-place-label"
            data-current={location === placeId}
            data-selected={selected === placeId}
            style={
              {
                "--place-x": `${place.x / 10}%`,
                "--place-y": `${(place.y + 48) / 6.5}%`,
              } as CSSProperties
            }
          >
            <span>{place.name}</span>
            {location === placeId && (
              <small>
                <i />
                You are here
              </small>
            )}
            {placeId === "ruins" && !visited.includes(placeId) && (
              <small>Unexplored</small>
            )}
          </div>
        ))}
      </div>
      <div className="valley-map-hint">
        <span aria-hidden="true">◇</span> Select a place to look around
      </div>
    </div>
  );
}
