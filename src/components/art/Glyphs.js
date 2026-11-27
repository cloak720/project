import React from "react";

// Small marks drawn inside the badge of the empty-state illustration (centred on 0,0, ~12px).
const MARKS = {
  inbox: <path d="M-6 1h3.5l1.5 2.5h2L2.5 1H6M-6 1l2-5.5h8L6 1v4.5h-12z" />,
  search: (
    <>
      <circle cx="-1" cy="-1" r="4.5" />
      <path d="m2.4 2.4 3.6 3.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="-6" y="-4.5" width="12" height="10.5" rx="2" />
      <path d="M-6-0.5h12M-2.5-7v4M2.5-7v4" />
    </>
  ),
  star: <path d="m0-6.5 1.9 4.1 4.4.5-3.3 3 .9 4.4L0 3.3l-3.9 2.2.9-4.4-3.3-3 4.4-.5z" />,
  check: <path d="m-5 0.5 3.4 3.4L5.2-3.4" />,
  message: <path d="M-6-4.5h12v8H-1l-3.5 3v-3H-6z" />,
  users: (
    <>
      <circle cx="-2" cy="-2.5" r="2.8" />
      <path d="M-7 5.5c.6-2.8 2.6-4.2 5-4.2s4.4 1.4 5 4.2M3.2-5.2a2.6 2.6 0 0 1 0 5M5 1.6c1.2.6 2 1.8 2.3 3.6" />
    </>
  ),
  plus: <path d="M0-5.5v11M-5.5 0h11" />,
  lock: (
    <>
      <rect x="-5" y="-1" width="10" height="7.5" rx="1.8" />
      <path d="M-3-1v-2.5a3 3 0 0 1 6 0V-1" />
    </>
  ),
};

/**
 * Empty-state illustration: two stacked cards on a dotted field with an accent badge.
 * Theme-aware through CSS variables, so it reads in light and dark mode.
 */
export const EmptyArt = ({ name = "inbox", className = "" }) => (
  <svg width="132" height="88" viewBox="0 0 132 88" className={`empty-art ${className}`} aria-hidden="true" focusable="false">
    <defs>
      <pattern id="ea-dots" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.9" fill="var(--border-strong)" />
      </pattern>
      <radialGradient id="ea-fade" cx="50%" cy="50%" r="50%">
        <stop offset="0.4" stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="ea-mask">
        <rect width="132" height="88" fill="url(#ea-fade)" />
      </mask>
    </defs>
    <rect width="132" height="88" fill="url(#ea-dots)" mask="url(#ea-mask)" />
    <g transform="rotate(-7 66 46)">
      <rect x="34" y="16" width="64" height="48" rx="9" fill="var(--surface-2)" stroke="var(--border)" />
    </g>
    <rect x="30" y="22" width="72" height="50" rx="9" fill="var(--surface)" stroke="var(--border-strong)" />
    <rect x="40" y="33" width="30" height="5" rx="2.5" fill="var(--surface-3)" />
    <rect x="40" y="44" width="48" height="4" rx="2" fill="var(--surface-3)" />
    <rect x="40" y="53" width="38" height="4" rx="2" fill="var(--surface-3)" />
    <g transform="translate(98 24)">
      <circle r="13" fill="var(--accent)" />
      <circle r="13" fill="none" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="6" />
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {MARKS[name] || MARKS.inbox}
      </g>
    </g>
  </svg>
);
