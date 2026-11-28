import React from "react";
import useRough from "./useRough";

/* Small hand-inked spot drawings (64 x 64), one per request and opportunity category. */

const Spot = ({ children, className = "clip__art" }) => {
  const [rough, filter] = useRough(1.1, 0.05);
  return (
    <svg className={`art ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>{filter}</defs>
      <g filter={`url(#${rough})`}>{children}</g>
    </svg>
  );
};

const LittleHeart = ({ x, y, className = "f-brick s thin" }) => (
  <path
    className={className}
    transform={`translate(${x} ${y}) scale(0.55)`}
    d="M0 8C-6 4-8 1-8-2c0-2.5 2-4 4-4 1.6 0 3 1 4 2.4C1-5 2.4-6 4-6c2 0 4 1.5 4 4 0 3-2 6-8 10Z"
  />
);

const Groceries = (p) => (
  <Spot {...p}>
    <path className="f-sage s" d="M24 26c-6-10 0-16 4-18 2 6 0 12-4 18Z" />
    <path className="f-forest s" d="M32 26c-2-10 6-16 10-16 0 8-4 12-10 16Z" />
    <path className="f-ochre s" d="M40 26l6-18a3 3 0 0 1 5 2l-5 16Z" />
    <path className="f-paper s" d="M14 25h36l-3 32H17Z" />
    <path className="s n thin" d="M14 25l3 5h30l3-5" />
    <LittleHeart x={32} y={42} />
  </Spot>
);

const Medical = (p) => (
  <Spot {...p}>
    <rect className="f-brick s" x="20" y="6" width="22" height="9" rx="2" />
    <rect className="f-paper s" x="16" y="15" width="30" height="42" rx="6" />
    <rect className="f-sky s thin" x="16" y="27" width="30" height="17" />
    <path className="s n thick" d="M31 31v9M26.5 35.5h9" />
    <rect className="f-ochre s thin" x="44" y="46" width="16" height="8" rx="4" transform="rotate(-24 52 50)" />
  </Spot>
);

const Household = (p) => (
  <Spot {...p}>
    <path className="s n thick" d="M24 24v-8h16v8" />
    <rect className="f-brick s" x="8" y="28" width="48" height="26" rx="4" />
    <rect className="f-brick s" x="6" y="23" width="52" height="9" rx="3" />
    <rect className="f-ochre s thin" x="28" y="29" width="8" height="7" rx="1.5" />
    <path className="s n thin st-paper" d="M14 44h36" />
  </Spot>
);

const Transport = (p) => (
  <Spot {...p}>
    <path className="s n thin soft" strokeDasharray="5 5" d="M2 56h60" />
    <path className="f-sky s" d="M5 46V36c0-2 1-3 3-3h6l7-12h21l8 12h5c2 0 4 1 4 3v10Z" />
    <path className="f-paper s thin" d="M23 24h7v9H17Z" />
    <path className="f-paper s thin" d="M34 24h7l6 9H34Z" />
    <circle className="f-line" cx="18" cy="46" r="6" />
    <circle className="f-line" cx="46" cy="46" r="6" />
    <circle className="f-paper" cx="18" cy="46" r="2.2" />
    <circle className="f-paper" cx="46" cy="46" r="2.2" />
  </Spot>
);

const Companionship = (p) => (
  <Spot {...p}>
    <path className="s n thin float" d="M24 20c-4-5 4-8 0-14M34 20c-4-5 4-8 0-14" />
    <path className="s n thick" d="M45 30a6 6 0 0 1 0 12h-2" />
    <path className="f-paper s" d="M14 26h31v8a15.5 15.5 0 0 1-31 0Z" />
    <path className="s n thick" d="M8 54h44" />
    <LittleHeart x={29} y={35} />
  </Spot>
);

const Note = (p) => (
  <Spot {...p}>
    <rect className="f-paper s" x="8" y="16" width="48" height="34" rx="3" />
    <path className="s n" d="M8 18l24 18 24-18" />
    <LittleHeart x={32} y={38} />
  </Spot>
);

const Sprout = (p) => (
  <Spot {...p}>
    <path className="s n thick" d="M32 38V20" />
    <path className="f-sage s" d="M32 28c-10 0-14-8-14-12 8 0 14 4 14 12Z" />
    <path className="f-forest s" d="M32 22c0-8 6-14 14-14 0 8-6 14-14 14Z" />
    <path className="f-brick s" d="M19 42h26l-4 16H23Z" />
    <rect className="f-brick s" x="15" y="37" width="34" height="7" rx="2" />
  </Spot>
);

const Book = (p) => (
  <Spot {...p}>
    <path className="f-paper s" d="M32 18C24 12 14 12 6 14v34c8-2 18-2 26 4Z" />
    <path className="f-paper s" d="M32 18c8-6 18-6 26-4v34c-8-2-18-2-26 4Z" />
    <path className="s n thin soft" d="M12 22c5-1 10-1 14 1M12 30c5-1 10-1 14 1M12 38c5-1 10-1 14 1M38 23c4-2 9-2 14-1M38 31c4-2 9-2 14-1" />
    <path className="f-brick s thin" d="M46 14v16l3-3 3 3V14" />
  </Spot>
);

const Teapot = (p) => (
  <Spot {...p}>
    <path className="s n thick" d="M47 38c6-2 8-8 11-10M13 34c-7 2-7 12 0 14" />
    <ellipse className="f-sage s" cx="30" cy="42" rx="18" ry="14" />
    <path className="f-sage s" d="M19 30c4-5 18-5 22 0Z" />
    <circle className="f-brick s thin" cx="30" cy="24" r="3" />
    <LittleHeart x={30} y={42} className="f-paper s thin" />
  </Spot>
);

const Crate = (p) => (
  <Spot {...p}>
    <circle className="f-brick s" cx="20" cy="31" r="7.5" />
    <circle className="f-sage s" cx="32" cy="28" r="7.5" />
    <circle className="f-brick s" cx="44" cy="31" r="7.5" />
    <path className="s n thin" d="M32 21c1-3 3-4 5-4" />
    <rect className="f-ochre s" x="8" y="34" width="48" height="22" rx="2" />
    <path className="s n thin" d="M8 45h48M20 34v22M44 34v22" />
  </Spot>
);

const Houses = (p) => (
  <Spot {...p}>
    <path className="f-brick s" d="M5 56V38l10-9 10 9v18Z" />
    <path className="f-paper s" d="M22 56V30l11-10 11 10v26Z" />
    <path className="f-sage s" d="M41 56V38l9-8 9 8v18Z" />
    <rect className="f-ochre s thin" x="29" y="40" width="8" height="16" rx="1" />
    <path className="s n" d="M2 56h60" />
    <LittleHeart x={33} y={11} />
  </Spot>
);

const ART = {
  Medical,
  Household,
  Transport,
  Groceries,
  Companionship,
  Community: Houses,
  Environment: Sprout,
  Education: Book,
  "Elderly care": Teapot,
  "Food drive": Crate,
};

/** Spot illustration for a category name; unknown categories get a friendly note. */
const CategoryArt = ({ category, className }) => {
  const Art = ART[category] || Note;
  return <Art className={className} />;
};

export default CategoryArt;
