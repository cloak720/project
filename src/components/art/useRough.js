import React, { useId } from "react";

/**
 * A tiny displacement filter that wobbles straight SVG geometry so it reads as hand-inked.
 * Returns [filterId, <filter/>] — drop the element into <defs> and apply url(#id) to a group.
 */
const useRough = (scale = 2, frequency = 0.035) => {
  const id = `rough-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const filter = (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="2" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
  return [id, filter];
};

export default useRough;
