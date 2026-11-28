import React from "react";
import useRough from "./useRough";

const Heart = ({ x, y, s = 1, className = "f-brick s thin" }) => (
  <path
    className={className}
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 8C-6 4-8 1-8-2c0-2.5 2-4 4-4 1.6 0 3 1 4 2.4C1-5 2.4-6 4-6c2 0 4 1.5 4 4 0 3-2 6-8 10Z"
  />
);

/** Landing hero: a volunteer handing groceries to an older neighbor at her door. */
export const HeroScene = ({ className = "" }) => {
  const [rough, filter] = useRough(2.2);
  return (
    <svg className={`art ${className}`} viewBox="0 0 560 440" role="img" aria-labelledby="hero-art-title">
      <title id="hero-art-title">A volunteer handing a bag of groceries to an older neighbor at her front door</title>
      <defs>{filter}</defs>

      <path className="f-blush wash" d="M88 304C58 206 132 86 266 72c134-14 236 64 230 176-6 106-104 142-226 140-114-2-156-30-182-84Z" />

      <g filter={`url(#${rough})`}>
        <g className="spin-slow">
          <path className="s n" d="M496 96h10M484.9 122.9l7 7M458 134v10M431.1 122.9l-7 7M420 96h-10M431.1 69.1l-7-7M458 58V48M484.9 69.1l7-7" />
        </g>
        <circle className="f-ochre s" cx="458" cy="96" r="28" />
        <path className="s n thin" d="M372 70q7-7 14 0q7-7 14 0M398 104q5-5 10 0q5-5 10 0" />

        <path className="f-sage wash" d="M14 380c90-6 190 6 286 0s180-6 246 2v26c-90 8-200 6-290 4S80 418 14 410Z" />

        {/* tree behind */}
        <path className="s n thick" d="M318 380V258M318 300l16-16M318 318l-14-12" />
        <path className="f-sage s" d="M266 226c-14-30 10-62 40-58 8-22 48-24 58 0 30-2 44 32 28 54 14 22-6 52-34 46-12 18-46 18-58 2-28 4-48-22-34-44Z" />
        <path className="s n thin" d="M300 200c6-4 12-4 16 0M340 186c6-3 10-2 14 2M326 236c6-4 12-4 16 0" />

        {/* left house */}
        <rect className="f-brick s" x="200" y="128" width="22" height="50" rx="2" />
        <path className="s n thin float" d="M211 118c-8-8 6-14-2-24-6-8 4-14 0-20" />
        <rect className="f-paper s" x="74" y="196" width="172" height="184" rx="2" />
        <path className="f-brick s" d="M56 204 160 116l104 88Z" />
        <path className="s n thin st-paper" d="M112 180l14-12M146 152l12-10M180 162l14 12M206 184l14 12" />
        <circle className="f-ochre s" cx="160" cy="168" r="13" />
        <path className="s n thin" d="M160 155v26M147 168h26" />
        <rect className="f-sky s" x="94" y="224" width="52" height="48" rx="3" />
        <path className="s n thin" d="M120 224v48M94 248h52" />
        <rect className="f-forest s" x="90" y="280" width="60" height="14" rx="2" />
        <circle className="f-ochre s thin" cx="100" cy="278" r="4.5" />
        <circle className="f-blush s thin" cx="114" cy="276" r="4.5" />
        <circle className="f-ochre s thin" cx="128" cy="278" r="4.5" />
        <circle className="f-blush s thin" cx="142" cy="276" r="4.5" />
        <rect className="f-ochre s" x="164" y="280" width="58" height="100" rx="2" />
        <path className="f-forest s" d="M164 280l-14 6v88l14 6Z" />
        <rect className="f-paper s" x="154" y="376" width="78" height="8" rx="2" />

        {/* right house */}
        <rect className="f-paper s" x="354" y="246" width="146" height="134" rx="2" />
        <path className="f-forest s" d="M340 252 427 186l87 66Z" />
        <path className="s n thin st-paper" d="M380 228l12-9M410 206l10-8M446 208l12 9M470 226l12 9" />
        <rect className="f-sky s" x="372" y="268" width="46" height="42" rx="3" />
        <path className="s n thin" d="M395 268v42M372 289h46" />
        <rect className="f-paper s" x="366" y="310" width="58" height="6" rx="2" />
        <path className="f-line" d="M402 310c-2-10 2-18 8-18s10 8 8 18Z" />
        <circle className="f-line" cx="410" cy="290" r="6" />
        <path className="f-line s thin" d="M405 286l1-6 4 4M411 284l4-4 1 6" />
        <path className="s n" d="M418 308c8 0 9-8 4-11" />
        <path className="f-ochre s" d="M444 380v-56a19 19 0 0 1 38 0v56Z" />
        <circle className="f-line" cx="474" cy="348" r="2.4" />
        <g className="sway">
          <path className="f-sage s thin" d="M498 364c-6-10-2-18 2-20 2 6 2 14-2 20Z" />
          <path className="f-forest s thin" d="M498 364c2-10 10-14 14-12-2 6-8 10-14 12Z" />
        </g>
        <path className="f-brick s" d="M490 380l-3-16h22l-3 16Z" />

        <path className="s n" d="M20 380c96-5 196 5 290 0s168-5 230 1" />
        <path className="s n thin soft" d="M110 396h30M176 398h40M256 397h30M330 398h44M410 396h30" />

        {/* neighbor at the door */}
        <path className="s n thick" d="M187 352v24M199 352v24" />
        <path className="f-forest s" d="M177 300l-5 56h42l-5-56Z" />
        <path className="f-sage s" d="M178 270c-6 8-6 22-4 34h38c2-12 2-26-4-34-8-6-22-6-30 0Z" />
        <path className="s n thick" d="M176 292l-8 84" />
        <circle className="f-skin1 s" cx="177" cy="292" r="4.5" />
        <path className="f-sage s" d="M204 272c10 4 20 14 26 24l-7 5c-6-8-14-16-22-20Z" />
        <circle className="f-skin1 s" cx="193" cy="250" r="15" />
        <path className="f-paper s" d="M178 249c0-12 7-19 15-19s15 7 15 19c-4-6-10-9-15-9s-11 3-15 9Z" />
        <circle className="f-paper s" cx="193" cy="229" r="6" />
        <circle className="s n thin" cx="187" cy="252" r="3.6" />
        <circle className="s n thin" cx="199" cy="252" r="3.6" />
        <path className="s n thin" d="M190.6 252h4.8M188 259q5 4 10 0" />
        <circle className="f-blush" cx="183" cy="258" r="2.5" />
        <circle className="f-blush" cx="203" cy="258" r="2.5" />

        {/* groceries */}
        <path className="f-sage s" d="M226 302c-6-14 2-22 6-24 2 8 0 16-6 24Z" />
        <path className="f-forest s" d="M234 302c0-12 8-18 12-18 0 8-4 14-12 18Z" />
        <path className="f-ochre s" d="M244 302l8-27a4 4 0 0 1 7 2l-7 25Z" />
        <path className="f-paper s" d="M218 300h38l-4 42h-30Z" />
        <path className="s n thin" d="M218 300l4 6h30l4-6" />
        <Heart x={237} y={322} s={0.8} />

        {/* volunteer */}
        <path className="f-sky s" d="M276 318l-2 58h12l2-46 4 46h12l-4-58Z" />
        <path className="s n thick" d="M272 377h14M291 377h15" />
        <path className="f-brick s" d="M270 262c-4 18-4 40-2 58h36c2-18 2-40-2-58-10-8-22-8-32 0Z" />
        <path className="s n thin" d="M280 258q8 6 16 0" />
        <path className="f-brick s" d="M302 268c6 14 8 28 6 42l-8-1c1-12 0-24-5-36Z" />
        <circle className="f-skin2 s" cx="304" cy="313" r="5" />
        <path className="f-brick s" d="M272 268c-10 8-20 18-26 28l7 5c6-8 14-16 24-22Z" />
        <circle className="f-skin2 s" cx="248" cy="300" r="5" />
        <circle className="f-skin1 s" cx="228" cy="300" r="5" />
        <circle className="f-skin2 s" cx="288" cy="236" r="16" />
        <path className="f-ochre s" d="M271 232c0-14 8-22 17-22s17 8 17 22Z" />
        <rect className="f-ochre s" x="269" y="227" width="38" height="8" rx="4" />
        <circle className="f-paper s" cx="288" cy="207" r="5" />
        <circle className="f-line" cx="281" cy="241" r="1.8" />
        <circle className="f-line" cx="292" cy="241" r="1.8" />
        <path className="s n thin" d="M281 247q5 4 10 0" />

        <g className="float">
          <Heart x={240} y={266} />
        </g>
        <g className="float float--late">
          <Heart x={258} y={246} s={0.65} className="f-blush s thin" />
        </g>
      </g>
    </svg>
  );
};

/** Auth screens: a welcoming front door with the porch light on. */
export const DoorScene = ({ className = "" }) => {
  const [rough, filter] = useRough(1.8);
  return (
    <svg className={`art ${className}`} viewBox="0 0 400 480" aria-hidden="true" focusable="false">
      <defs>{filter}</defs>
      <circle className="f-ochre wash" cx="84" cy="150" r="46" />
      <g filter={`url(#${rough})`}>
        <path className="s n thin soft" d="M20 60h60M30 90h40M330 60h50M320 100h60M24 230h44M332 210h48M28 300h40M330 290h44" />
        <rect className="f-paper s" x="110" y="90" width="180" height="330" rx="4" />
        <path className="f-forest s" d="M126 420V180a74 74 0 0 1 148 0v240Z" />
        <path className="f-ochre s" d="M150 180a50 50 0 0 1 100 0Z" />
        <path className="s n thin" d="M200 180v-50M200 180l-35-35M200 180l35-35" />
        <rect className="f-shadow s thin" x="146" y="208" width="46" height="84" rx="4" />
        <rect className="f-shadow s thin" x="208" y="208" width="46" height="84" rx="4" />
        <rect className="f-shadow s thin" x="146" y="316" width="46" height="84" rx="4" />
        <rect className="f-shadow s thin" x="208" y="316" width="46" height="84" rx="4" />
        <path className="f-paper s thin" d="M186 300l8-14h22l-6 14Z" />
        <rect className="f-ochre s" x="176" y="298" width="48" height="10" rx="3" />
        <circle className="f-ochre s" cx="258" cy="360" r="6" />
        <circle className="f-paper s" cx="200" cy="66" r="18" />
        <text x="200" y="73" textAnchor="middle" className="f-line" style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600 }}>
          14
        </text>
        <path className="s n" d="M106 150H92" />
        <path className="f-ochre s" d="M74 152l4-26h16l4 26Z" />
        <path className="s n" d="M72 152h28" />
        <rect className="f-paper s" x="96" y="420" width="208" height="16" rx="3" />
        <rect className="f-paper s" x="82" y="436" width="236" height="16" rx="3" />
        <rect className="f-brick s" x="150" y="412" width="100" height="10" rx="2" />
        <rect className="f-paper s" x="116" y="394" width="13" height="26" rx="5" />
        <rect className="f-paper s" x="133" y="398" width="13" height="22" rx="5" />
        <path className="s n thin" d="M116 404h13M133 407h13" />
        <g className="sway">
          <path className="f-sage s" d="M336 420c-14-20-8-44 0-50 8 14 8 34 0 50Z" />
          <path className="f-forest s" d="M336 420c-2-26 16-40 26-40-2 16-12 32-26 40Z" />
          <path className="f-forest s" d="M336 420c-6-24-28-30-36-26 4 14 18 24 36 26Z" />
        </g>
        <path className="f-brick s" d="M316 452l-6-34h52l-6 34Z" />
        <g className="float">
          <Heart x={46} y={96} s={0.9} />
        </g>
        <g className="float float--late">
          <Heart x={356} y={150} s={0.7} className="f-blush s thin" />
        </g>
      </g>
    </svg>
  );
};

/* ---------- Empty-state vignettes (132 x 104) ---------- */

const Vignette = ({ children, className = "empty__art" }) => {
  const [rough, filter] = useRough(1.4);
  return (
    <svg className={`art ${className}`} viewBox="0 0 132 104" aria-hidden="true" focusable="false">
      <defs>{filter}</defs>
      <g filter={`url(#${rough})`}>{children}</g>
    </svg>
  );
};

export const MailboxArt = (props) => (
  <Vignette {...props}>
    <path className="s n thin soft" d="M14 100h104" />
    <rect className="f-paper s" x="62" y="56" width="9" height="44" rx="2" />
    <path className="f-brick s" d="M36 58V40a18 18 0 0 1 18-18h26a18 18 0 0 1 18 18v18Z" />
    <path className="s n thin" d="M54 22a18 18 0 0 1 18 18v18" />
    <path className="f-ochre s" d="M92 46V14h14v10H97" />
    <rect className="f-paper s thin" x="8" y="10" width="22" height="15" rx="2" />
    <path className="s n thin" d="M8 11l11 8 11-8" />
    <path className="s n thin" strokeDasharray="3 5" d="M34 18c10 2 16 8 22 2" />
  </Vignette>
);

export const NoticeboardArt = (props) => (
  <Vignette {...props}>
    <path className="s n" d="M34 86l-6 16M98 86l6 16" />
    <rect className="f-paper s" x="14" y="8" width="104" height="78" rx="6" />
    <rect className="f-ochre s thin soft" x="22" y="16" width="88" height="62" rx="3" />
    <g transform="rotate(-6 60 42)">
      <rect className="f-paper s thin" x="46" y="28" width="30" height="28" rx="1" />
      <path className="s n thin soft" d="M51 40h20M51 46h14" />
    </g>
    <circle className="f-brick s thin" cx="60" cy="30" r="3.4" />
    <circle className="f-sky s thin" cx="92" cy="26" r="2.6" />
    <circle className="f-sage s thin" cx="34" cy="64" r="2.6" />
  </Vignette>
);

export const CalendarArt = (props) => (
  <Vignette {...props}>
    <rect className="f-paper s" x="26" y="18" width="80" height="74" rx="8" />
    <path className="f-brick s" d="M26 38V26a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8v12Z" />
    <path className="s n thick" d="M46 12v14M86 12v14" />
    <g className="f-line soft">
      {[0, 1, 2, 3, 4].map((c) =>
        [0, 1, 2].map((r) => <circle key={`${c}-${r}`} cx={40 + c * 13} cy={52 + r * 13} r="2" />)
      )}
    </g>
    <Heart x={79} y={63} s={0.75} />
  </Vignette>
);

export const SignpostArt = (props) => (
  <Vignette {...props}>
    <path className="s n thin soft" d="M28 100h76" />
    <rect className="f-paper s" x="62" y="14" width="9" height="86" rx="2" />
    <path className="f-brick s" d="M71 24h36l10 10-10 10H71Z" />
    <path className="f-sage s" d="M62 52H28L18 62l10 10h34Z" />
    <path className="s n thin" d="M80 34h18M30 62h20" />
  </Vignette>
);

export const TeacupArt = (props) => (
  <Vignette {...props}>
    <ellipse className="f-sage s" cx="64" cy="94" rx="40" ry="6" />
    <path className="s n thick" d="M92 56a10 10 0 0 1 0 20h-4" />
    <path className="f-paper s" d="M36 50h56v14a28 28 0 0 1-28 28 28 28 0 0 1-28-28Z" />
    <g className="float">
      <path className="s n thin" d="M54 40c-6-8 6-12 0-22M72 40c-6-8 6-12 0-22" />
    </g>
    <Heart x={64} y={66} s={0.9} />
  </Vignette>
);

export const StarsArt = (props) => (
  <Vignette {...props}>
    <path className="f-brick s" d="M52 70l-10 30 14-6 8 12 6-30ZM80 70l10 30-14-6-8 12-6-30Z" />
    <circle className="f-ochre s" cx="66" cy="48" r="30" />
    <circle className="s n thin" cx="66" cy="48" r="22" strokeDasharray="2 4" />
    <path className="f-paper s thin" d="M66 34l4.4 9 9.9 1.4-7.2 7 1.7 9.8-8.8-4.6-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4Z" />
  </Vignette>
);
