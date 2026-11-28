import React, { useId } from "react";

/** A rubber-stamp roundel with slowly turning lettering. */
const Stamp = ({ text = "Free · Local · Kind · Free · Local · Kind · ", className = "" }) => {
  const pathId = `stamp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg className={`art stamp ${className}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <path id={pathId} d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <circle className="f-ochre" cx="60" cy="60" r="58" />
      <circle className="s n thin" cx="60" cy="60" r="54" strokeDasharray="1 4" />
      <g className="spin-slow">
        <text className="stamp__text">
          <textPath href={`#${pathId}`} textLength="268" lengthAdjust="spacing">
            {text.toUpperCase()}
          </textPath>
        </text>
      </g>
      <path
        className="f-brick s"
        transform="translate(60 58) scale(1.6)"
        d="M0 8C-6 4-8 1-8-2c0-2.5 2-4 4-4 1.6 0 3 1 4 2.4C1-5 2.4-6 4-6c2 0 4 1.5 4 4 0 3-2 6-8 10Z"
      />
    </svg>
  );
};

export default Stamp;
