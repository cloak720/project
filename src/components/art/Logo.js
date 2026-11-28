import React from "react";
import { Link } from "react-router-dom";

/** The mark: a little house with a heart for a door, and a curl of smoke from the chimney. */
export const LogoMark = ({ className = "brand__mark" }) => (
  <svg className={`logo-mark ${className}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path className="smoke" d="M28.6 7.2c-1.8-1.4.9-2.6-.4-4.4" />
    <rect className="chimney" x="25.6" y="8" width="4.4" height="8" rx="1" />
    <path className="roof" d="M5.6 18.4 18.3 7.1a2.6 2.6 0 0 1 3.4 0l12.7 11.3c.8.7.3 2-.8 2H32v12.4a2.4 2.4 0 0 1-2.4 2.4H10.4A2.4 2.4 0 0 1 8 32.8V20.4H6.4c-1.1 0-1.6-1.3-.8-2Z" />
    <path
      className="heart"
      d="M20 31.6c-5.2-3.4-6.8-6.2-6.8-8.4 0-2.1 1.6-3.6 3.5-3.6 1.4 0 2.6.8 3.3 2 .7-1.2 1.9-2 3.3-2 1.9 0 3.5 1.5 3.5 3.6 0 2.2-1.6 5-6.8 8.4Z"
    />
  </svg>
);

const Logo = ({ to = "/", label = "NeighborAid home" }) => (
  <Link to={to} className="brand" aria-label={label}>
    <LogoMark />
    <span className="brand__word" aria-hidden="true">
      Neighbor<i>Aid</i>
    </span>
  </Link>
);

export default Logo;
