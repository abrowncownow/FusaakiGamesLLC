import type { Settlement } from "@fusaakigames/simulation";
export function WorldMap({ groups }: { groups: Settlement[] }) {
  return (
    <svg
      className="world-map"
      viewBox="0 0 800 380"
      role="img"
      aria-label="Willow village and Bracken camp connected to a timber forest and ore mine. Numbered markers show cargo on the road."
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
      <path
        d="M 665 100 Q 480 320 165 240 M 665 100 Q 715 185 640 240"
        fill="none"
        stroke="#a59e8e"
        strokeWidth="5"
        strokeDasharray="6 6"
      />
      <path
        d="M 620 103 L 650 58 L 673 83 L 687 65 L 711 103 Z"
        fill="#8b9384"
      />
      <path d="M 652 103 L 664 84 L 676 103 Z" fill="#43584b" />
      <text x="665" y="132" textAnchor="middle" className="map-label">
        GREY RIDGE MINE
      </text>
      {groups.map((group, index) => {
        const x = index === 0 ? 165 : 640;
        const color = index === 0 ? "#9a6551" : "#63764f";
        const convoy = group.convoy;
        const progress = convoy ? (3 - convoy.travelRemaining) / 3 : 0;
        const sharedDeparture =
          convoy &&
          progress === 0 &&
          groups.some(
            (other) =>
              other.id !== group.id &&
              other.convoy?.resource === convoy.resource &&
              other.convoy.travelRemaining === 3,
          );
        const startX = convoy?.resource === "ore" ? 665 : 388;
        const startY = convoy?.resource === "ore" ? 100 : 138;
        const controlX =
          convoy?.resource === "ore"
            ? index === 0
              ? 480
              : 715
            : index === 0
              ? 260
              : 445;
        const controlY =
          convoy?.resource === "ore"
            ? index === 0
              ? 320
              : 185
            : index === 0
              ? 310
              : 230;
        const curve = (start: number, control: number, end: number) =>
          (1 - progress) ** 2 * start +
          2 * (1 - progress) * progress * control +
          progress ** 2 * end;
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
            {group.workshop.complete && (
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
            {convoy && (
              <g
                transform={`translate(${curve(startX, controlX, x) + (sharedDeparture ? (index === 0 ? -16 : 16) : 0)},${curve(startY, controlY, index === 0 ? 240 : 247)})`}
              >
                <title>
                  {group.name}: {convoy.amount} {convoy.resource},{" "}
                  {convoy.escorts} escorts, {convoy.travelRemaining} days to
                  arrival
                </title>
                <circle
                  r="13"
                  fill={index === 0 ? "#8a5541" : "#263e35"}
                  stroke="#f8e5b4"
                  strokeWidth="3"
                />
                <text y="5" textAnchor="middle" fill="white" fontSize="13">
                  {convoy.amount}
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
