import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Star, TriangleAlert } from "lucide-react";
import { initials, normStatus } from "../lib/format";

/* ---------- Motion ---------- */

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

/** Staggered entrance for lists of cards. */
export const listItem = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: Math.min(i, 8) * 0.045, ease: [0.22, 1, 0.36, 1] },
});

/* ---------- Loading ---------- */

export const Loading = ({ label = "Fetching the latest…" }) => (
  <div className="loading" role="status">
    <span className="loading__dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
    <span>{label}</span>
  </div>
);

/** Placeholder cards while a list loads, so the layout doesn't jump. */
export const SkeletonGrid = ({ count = 3, height = 220, label = "Loading" }) => (
  <div className="grid" role="status" aria-label={label}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="skeleton" style={{ height }} />
    ))}
  </div>
);

/* ---------- Headings ---------- */

export const PageHead = ({ kicker, title, lede, actions, children }) => (
  <motion.header className="page-head" {...fadeUp}>
    <div className="page-head__text">
      {kicker && <p className="kicker">{kicker}</p>}
      <h1>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </div>
    {actions && <div className="page-head__actions">{actions}</div>}
  </motion.header>
);

export const SectionHead = ({ title, count, action, as: Tag = "h2", id }) => (
  <div className="section-head">
    <Tag id={id}>
      {title}
      {count !== undefined && <span className="section-head__count">{count}</span>}
    </Tag>
    {action}
  </div>
);

/* ---------- Feedback ---------- */

const ALERT_ICONS = { error: AlertCircle, success: CheckCircle2, info: Info, warning: TriangleAlert };

export const Alert = ({ tone = "error", children, onClose }) => {
  if (!children) return null;
  const Icon = ALERT_ICONS[tone] || Info;
  return (
    <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ art: Art, title, children, action }) => (
  <motion.div className="empty" {...fadeUp}>
    {Art && <Art />}
    <p className="empty__title">{title}</p>
    {children && <p className="empty__text">{children}</p>}
    {action}
  </motion.div>
);

/* ---------- Badges ---------- */

const STATUS_LABELS = { PENDING: "Waiting for a helper", ACCEPTED: "Helper on the way", COMPLETED: "Done" };

export const StatusBadge = ({ status, short }) => {
  const s = normStatus(status);
  const label = short ? s.charAt(0) + s.slice(1).toLowerCase() : STATUS_LABELS[s] || s;
  return <span className={`badge badge--dot badge--${s.toLowerCase()}`}>{label}</span>;
};

const URGENCY_TONES = { High: "danger", Medium: "warning", Low: "outline" };

export const UrgencyBadge = ({ urgency }) =>
  urgency ? <span className={`badge badge--${URGENCY_TONES[urgency] || "outline"}`}>{urgency} urgency</span> : null;

/* ---------- Forms ---------- */

/** Label + control + error/hint, wired together for screen readers. */
export const Field = ({ label, htmlFor, error, hint, optional, children, className = "" }) => (
  <div className={`field ${error ? "field--invalid" : ""} ${className}`}>
    <div className="label-row">
      <label htmlFor={htmlFor}>{label}</label>
      {optional && <span className="optional">Optional</span>}
    </div>
    {children}
    {error ? (
      <p className="field__error" id={`${htmlFor}-error`}>
        <AlertCircle size={14} aria-hidden="true" /> {error}
      </p>
    ) : (
      hint && (
        <p className="field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      )
    )}
  </div>
);

/** Props that connect an input to its Field's error or hint text. */
export const describedBy = (name, error, hint) =>
  error ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : hint ? { "aria-describedby": `${name}-hint` } : {};

/* ---------- Tabs ---------- */

/** Accessible tab list with arrow-key navigation. Pair with <TabPanel idBase={…} active={…}>. */
export const Tabs = ({ tabs, active, onChange, label, idBase }) => {
  const refs = useRef({});
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    let next = null;
    if (step) next = tabs[(i + step + tabs.length) % tabs.length];
    if (e.key === "Home") next = tabs[0];
    if (e.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    refs.current[next.id]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => (refs.current[t.id] = el)}
          id={`${idBase}-tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`${idBase}-panel`}
          tabIndex={active === t.id ? 0 : -1}
          className={`tabs__tab ${active === t.id ? "is-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <t.icon size={16} aria-hidden="true" />}
          {t.label}
          {t.count !== undefined && <span className={`tabs__count ${t.alert ? "tabs__count--alert" : ""}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
};

export const TabPanel = ({ idBase, active, children }) => (
  <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${active}`}>
    {children}
  </div>
);

/* ---------- People & numbers ---------- */

const AVATAR_TONES = ["", "avatar--forest", "avatar--ochre", "avatar--sky", "avatar--plum"];

export const Avatar = ({ person, size = "" }) => {
  const key = `${person?.firstName || ""}${person?.lastName || ""}${person?.id || ""}`;
  const tone = AVATAR_TONES[[...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span className={`avatar ${size ? `avatar--${size}` : ""} ${tone}`} aria-hidden="true">
      {initials(person)}
    </span>
  );
};

/** Editorial stat strip: big serif numerals with small-caps labels. */
export const Numbers = ({ items, label }) => (
  <section className="numbers" aria-label={label}>
    {items.map((item) => {
      const Tag = item.onClick ? "button" : "div";
      return (
        <Tag
          key={item.label}
          className={`number ${item.onClick ? "number--button" : ""}`}
          {...(item.onClick ? { type: "button", onClick: item.onClick } : {})}
        >
          <span className="number__label">
            {item.icon && <item.icon size={14} aria-hidden="true" />}
            {item.label}
          </span>
          <span className="number__value">{item.value}</span>
          {item.hint && <span className="number__hint">{item.hint}</span>}
        </Tag>
      );
    })}
  </section>
);

/**
 * A handwritten note taped to the page: the friendly summary at the top of each home page.
 * `lines` are short sentences (strings or nodes); empty ones are skipped.
 */
export const Note = ({ label, lines, signOff, children }) => (
  <section className="note" aria-label={label}>
    <span className="note__tape" aria-hidden="true" />
    <ul className="note__lines">
      {lines.filter(Boolean).map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
    {children}
    {signOff && <p className="note__sign">{signOff}</p>}
  </section>
);

/** An inline text action inside a Note line, e.g. "see your tasks". */
export const NoteAction = ({ onClick, to, children }) =>
  to ? (
    <Link to={to} className="note__action">
      {children}
    </Link>
  ) : (
    <button type="button" className="note__action" onClick={onClick}>
      {children}
    </button>
  );

/** Progress bar for "3 of 5 spots filled". */
export const Capacity = ({ taken, limit }) => {
  const safeLimit = Math.max(1, limit || 1);
  const pct = Math.min(100, Math.round((taken / safeLimit) * 100));
  const full = taken >= safeLimit;
  return (
    <div className="capacity">
      <div
        className="capacity__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-valuenow={Math.min(taken, safeLimit)}
        aria-label="Spots filled"
      >
        <span style={{ width: `${pct}%` }} className={full ? "is-full" : ""} />
      </div>
      <span className="capacity__label">
        <span>
          {taken} of {safeLimit} joined
        </span>
        <span>{full ? "Full" : `${safeLimit - taken} ${safeLimit - taken === 1 ? "spot" : "spots"} left`}</span>
      </span>
    </div>
  );
};

/** Read-only star rating. */
export const StarRow = ({ value = 0, size = 15 }) => (
  <span className="star-row" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} className={n <= Math.round(value) ? "" : "is-off"} fill="currentColor" aria-hidden="true" />
    ))}
  </span>
);

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Outstanding"];

/** Star picker: a radio group, so arrow keys work like any other radio set. */
export const StarInput = ({ value, onChange, id }) => (
  <div className="stars" role="radiogroup" aria-labelledby={id}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}, ${RATING_WORDS[n]}`}
        tabIndex={value === n || (!value && n === 1) ? 0 : -1}
        className={value >= n ? "is-on" : ""}
        onClick={() => onChange(n)}
        onKeyDown={(e) => {
          const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? n + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? n - 1 : null;
          if (next && next >= 1 && next <= 5) {
            e.preventDefault();
            onChange(next);
            e.currentTarget.parentElement.children[next - 1]?.focus();
          }
        }}
      >
        <Star size={30} fill={value >= n ? "currentColor" : "none"} aria-hidden="true" />
      </button>
    ))}
    {value > 0 && (
      <span className="stars__word" aria-hidden="true">
        {RATING_WORDS[value]}
      </span>
    )}
  </div>
);

/** Posted → Matched → Done. */
export const Stepper = ({ status }) => {
  const s = normStatus(status);
  const at = { PENDING: 0, ACCEPTED: 1, COMPLETED: 2 }[s] ?? 0;
  const steps = ["Posted", "Helper found", "Done"];
  return (
    <ol className="stepper" aria-label={`Progress: ${steps[at]}`}>
      {steps.map((label, i) => (
        <li key={label} className={i < at || s === "COMPLETED" ? "is-done" : i === at ? "is-current" : ""}>
          {label}
        </li>
      ))}
    </ol>
  );
};
