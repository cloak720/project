import React from "react";

// A stylised street grid: 6 x 5 blocks, 80 x 72 units apart. Streets run along the gaps,
// so routes can be drawn as straight segments between intersections.
const COLS = 6;
const ROWS = 5;
const CW = 80;
const RH = 72;

// [col, row, kind] where kind is "home", "helped" (a household that got help) or "park".
const LOTS = [
  [0, 0, "home"], [1, 0, "park"], [2, 0, "home"], [3, 0, "home"], [4, 0, "helped"], [5, 0, "home"],
  [0, 1, "home"], [1, 1, "helped"], [2, 1, "home"], [3, 1, "home"], [4, 1, "home"], [5, 1, "park"],
  [0, 2, "park"], [1, 2, "home"], [2, 2, "home"], [3, 2, "helped"], [4, 2, "home"], [5, 2, "home"],
  [0, 3, "home"], [1, 3, "home"], [2, 3, "park"], [3, 3, "home"], [4, 3, "home"], [5, 3, "helped"],
  [0, 4, "helped"], [1, 4, "home"], [2, 4, "home"], [3, 4, "home"], [4, 4, "park"], [5, 4, "home"],
];

const House = ({ cx, cy, helped }) => (
  <path
    d={`M${cx - 11} ${cy + 12}V${cy - 1}L${cx} ${cy - 11}L${cx + 11} ${cy - 1}V${cy + 12}Z`}
    className={helped ? "map__house map__house--helped" : "map__house"}
  />
);

const Park = ({ cx, cy }) => (
  <g className="map__park">
    <circle cx={cx - 9} cy={cy + 2} r="7" />
    <circle cx={cx + 6} cy={cy - 5} r="9" />
    <circle cx={cx + 10} cy={cy + 9} r="5" />
  </g>
);

/** Decorative map used on the landing page and auth screens. Routes animate unless reduced motion is on. */
const NeighborhoodMap = ({ className = "" }) => (
  <svg viewBox={`0 0 ${COLS * CW} ${ROWS * RH}`} className={`map ${className}`} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="map-glow" cx="320" cy="144" r="150" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
        <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
      </radialGradient>
    </defs>

    {LOTS.map(([c, r, kind]) => {
      const x = 8 + c * CW;
      const y = 8 + r * RH;
      const cx = x + 32;
      const cy = y + 30;
      return (
        <g key={`${c}-${r}`}>
          <rect x={x} y={y} width="64" height="56" rx="10" className={`map__block ${kind === "park" ? "map__block--park" : ""}`} />
          {kind === "park" ? <Park cx={cx} cy={cy} /> : <House cx={cx} cy={cy} helped={kind === "helped"} />}
        </g>
      );
    })}

    <circle cx="320" cy="144" r="150" fill="url(#map-glow)" />

    {/* A second, quieter route: another volunteer heading over. */}
    <path d="M400 72V144H320" className="map__route map__route--faint" />
    {/* Main route: volunteer to the request. */}
    <path d="M80 288H240V144H320" className="map__route" />

    <g className="map__volunteer" transform="translate(80 288)">
      <circle r="11" />
      <circle r="4.5" className="map__volunteer-core" />
    </g>
    <g className="map__volunteer map__volunteer--faint" transform="translate(400 72)">
      <circle r="9" />
      <circle r="3.5" className="map__volunteer-core" />
    </g>

    <g transform="translate(320 144)">
      <circle r="22" className="map__pulse" />
      <circle r="22" className="map__pulse map__pulse--late" />
      <circle r="12" className="map__pin" />
      <path d="M0-5v10M-5 0h10" className="map__pin-plus" />
    </g>
  </svg>
);

export default NeighborhoodMap;
