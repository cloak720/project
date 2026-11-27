import React, { useId } from "react";

/**
 * The NeighborAid mark: a house drawn from one continuous roofline, with a "plus" for aid
 * where the door would be. Set on an iris tile with a soft top highlight.
 */
export const LogoMark = ({ size = 28, className = "" }) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`brand__mark ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8478ff" />
          <stop offset="0.55" stopColor="#5b4ff5" />
          <stop offset="1" stopColor="#3a2fc4" />
        </linearGradient>
        <linearGradient id={`${id}-hi`} x1="16" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill={`url(#${id}-bg)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill={`url(#${id}-hi)`} stroke="#fff" strokeOpacity="0.18" />
      <path
        d="M7.5 15.2 16 8.2l8.5 7M10 13.4v9.1a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-9.1"
        fill="none"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 15.6v5.6M13.2 18.4h5.6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
};

export const Logo = ({ size = 28 }) => (
  <>
    <LogoMark size={size} />
    <span className="brand__word">
      Neighbor<b>Aid</b>
    </span>
  </>
);
