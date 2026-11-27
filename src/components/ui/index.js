import React, { useId } from "react";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Star, X } from "lucide-react";
import { STATUS_LABELS, URGENCY_LEVEL, hueFor, initials, normStatus } from "../../lib/format";
import { isMac } from "../../lib/hooks";
import { EmptyArt } from "../art/Glyphs";

/* ---------- Layout ---------- */

export const PageHeader = ({ eyebrow, title, subtitle, actions, icon: Icon }) => (
  <header className="page-head">
    <div>
      {eyebrow && (
        <p className="page-head__eyebrow">
          {Icon && <Icon size={14} aria-hidden="true" />}
          {eyebrow}
        </p>
      )}
      <h1 className="page-head__title">{title}</h1>
      {subtitle && <p className="page-head__sub">{subtitle}</p>}
    </div>
    {actions && <div className="page-head__actions">{actions}</div>}
  </header>
);

export const SectionHeader = ({ title, count, action, icon: Icon, as: Tag = "h2" }) => (
  <div className="section-head">
    <Tag>
      {Icon && <Icon size={16} aria-hidden="true" className="muted" />}
      {title}
      {count !== undefined && <span className="section-head__count">{count}</span>}
    </Tag>
    {action}
  </div>
);

/* ---------- Feedback ---------- */

const ALERT_ICONS = { error: AlertCircle, success: CheckCircle2, info: Info, warning: AlertTriangle };

export const Alert = ({ tone = "error", children, onClose, action }) => {
  if (!children) return null;
  const Icon = ALERT_ICONS[tone];
  return (
    <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={16} aria-hidden="true" />
      <div className="alert__body">{children}</div>
      {action}
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ art = "inbox", title, children, action, compact }) => (
  <div className={`empty ${compact ? "empty--compact" : ""}`}>
    <EmptyArt name={art} className="empty__art" />
    <p className="empty__title">{title}</p>
    {children && <p className="empty__text">{children}</p>}
    {action && <div className="empty__action">{action}</div>}
  </div>
);

export const Skeleton = ({ w = "100%", h = 12, r, style }) => (
  <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />
);

export const SkeletonCards = ({ count = 6, label = "Loading" }) => (
  <div className="card-grid" role="status" aria-label={label}>
    {Array.from({ length: count }, (_, i) => (
      <div className="skeleton-card" key={i}>
        <div className="row row--between">
          <Skeleton w="55%" h={14} />
          <Skeleton w={64} h={20} r={999} />
        </div>
        <Skeleton w="92%" />
        <Skeleton w="70%" />
        <div className="row" style={{ marginTop: 6 }}>
          <Skeleton w={72} h={20} r={999} />
          <Skeleton w={96} h={20} r={999} />
        </div>
        <Skeleton w="100%" h={30} r={8} style={{ marginTop: 8 }} />
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="stats" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <div className="stat" key={i}>
        <Skeleton w="50%" />
        <Skeleton w="35%" h={26} />
        <Skeleton w="60%" h={10} />
      </div>
    ))}
  </div>
);

/** Placeholder while a page's code chunk loads. */
export const PageFallback = () => (
  <div className="stack stack--lg" role="status" aria-label="Loading page">
    <div className="stack" style={{ gap: 10 }}>
      <Skeleton w={120} h={12} />
      <Skeleton w={280} h={26} />
    </div>
    <SkeletonStats />
    <SkeletonCards count={3} />
  </div>
);

export const SkeletonRows = ({ rows = 6 }) => (
  <div className="table-wrap" role="status" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="row" style={{ padding: "14px 16px", gap: 16, borderBottom: "1px solid var(--border)" }}>
        <Skeleton w={28} h={28} r={999} />
        <div className="stack" style={{ gap: 6, flex: 1 }}>
          <Skeleton w="40%" />
          <Skeleton w="25%" h={10} />
        </div>
        <Skeleton w={70} h={20} r={999} />
      </div>
    ))}
  </div>
);

/* ---------- Data display ---------- */

const STATUS_TONES = { PENDING: "warning", ACCEPTED: "info", COMPLETED: "success" };

export const StatusBadge = ({ status }) => {
  const s = normStatus(status);
  return (
    <span className={`badge badge--${STATUS_TONES[s] || "neutral"}`}>
      <span className="badge__dot" aria-hidden="true" />
      {STATUS_LABELS[s] || s}
    </span>
  );
};

const URGENCY_TONES = { High: "danger", Medium: "warning", Low: "outline" };

export const UrgencyBadge = ({ urgency }) =>
  urgency ? (
    <span className={`badge badge--${URGENCY_TONES[urgency] || "outline"}`}>
      <span className="signal" data-level={URGENCY_LEVEL[urgency] || 1} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {urgency}
    </span>
  ) : null;

export const Avatar = ({ person, size }) => (
  <span
    className={`avatar ${size ? `avatar--${size}` : ""}`}
    style={{ "--hue": hueFor(person?.id ?? person?.email ?? initials(person)) }}
    aria-hidden="true"
  >
    {initials(person)}
  </span>
);

export const Stat = ({ icon: Icon, label, value, hint, accent, to, as: Tag = "div", ...rest }) => (
  <Tag className={`stat ${accent ? "stat--accent" : ""}`} {...(to ? { to } : {})} {...rest}>
    <span className="stat__label">
      {Icon && (
        <span className="stat__icon">
          <Icon size={13} aria-hidden="true" />
        </span>
      )}
      {label}
    </span>
    <span className="stat__value">{value}</span>
    {hint && <span className="stat__hint">{hint}</span>}
  </Tag>
);

/** Segmented capacity meter: one cell per spot up to 12, a continuous bar beyond that. */
export const Capacity = ({ taken, limit }) => {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const full = taken >= safeLimit;
  const left = Math.max(0, safeLimit - taken);
  return (
    <div className={`capacity ${full ? "capacity--full" : ""}`}>
      <div className="capacity__row">
        <span>{full ? "Fully booked" : `${left} of ${safeLimit} spots open`}</span>
        <strong>
          {Math.min(taken, safeLimit)}/{safeLimit}
        </strong>
      </div>
      {safeLimit <= 12 ? (
        <div className="capacity__track" aria-hidden="true">
          {Array.from({ length: safeLimit }, (_, i) => (
            <span key={i} className={i < taken ? "is-on" : ""} />
          ))}
        </div>
      ) : (
        <div className="capacity__bar" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (taken / safeLimit) * 100)}%` }} />
        </div>
      )}
    </div>
  );
};

const STEPS = ["PENDING", "ACCEPTED", "COMPLETED"];
const STEP_LABELS = { PENDING: "Posted", ACCEPTED: "Accepted", COMPLETED: "Done" };

export const Stepper = ({ status }) => {
  const current = STEPS.indexOf(normStatus(status));
  return (
    <ol className={`stepper ${current === 2 ? "stepper--complete" : ""}`} aria-label={`Progress: ${STEP_LABELS[STEPS[current]]}`}>
      {STEPS.map((s, i) => (
        <li key={s} className={`stepper__step ${i <= current ? "is-done" : ""} ${i === current ? "is-current" : ""}`}>
          <span className="stepper__bar" />
          {STEP_LABELS[s]}
        </li>
      ))}
    </ol>
  );
};

export const Stars = ({ value = 0, size = 14 }) => (
  <span className="stars-static" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} className={n <= value ? "" : "is-off"} fill="currentColor" aria-hidden="true" />
    ))}
  </span>
);

export const Kbd = ({ keys }) => (
  <span className="kbd-group" aria-hidden="true">
    {keys.map((k) => (
      <kbd key={k}>{k === "mod" ? (isMac ? "⌘" : "Ctrl") : k}</kbd>
    ))}
  </span>
);

/* ---------- Forms ---------- */

/** Label + control + error/hint, wired together for screen readers. */
export const Field = ({ label, htmlFor, error, hint, optional, children, className = "", aside }) => (
  <div className={`field ${error ? "field--invalid" : ""} ${className}`}>
    <div className="field__row">
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span className="label__opt"> (optional)</span>}
      </label>
      {aside}
    </div>
    {children}
    {error ? (
      <p className="field__error" id={`${htmlFor}-error`}>
        <AlertCircle size={13} aria-hidden="true" style={{ marginTop: 1, flexShrink: 0 }} />
        {error}
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

/** Accessible props for an input inside <Field>. */
export const fieldProps = (name, error, hint) => ({
  id: name,
  name,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${name}-error` : hint ? `${name}-hint` : undefined,
});

/** Radio group rendered as selectable cards. options: [{ value, title, text, icon }] */
export const ChoiceGroup = ({ legend, name, value, onChange, options, cols = 2, error }) => (
  <fieldset className="choices" style={{ "--cols": cols }} aria-invalid={error ? true : undefined}>
    <legend className="label">{legend}</legend>
    {options.map((o) => {
      const selected = String(value) === String(o.value);
      return (
        <label key={o.value} className={`choice ${selected ? "is-selected" : ""}`}>
          <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} />
          {o.icon && (
            <span className="choice__icon" aria-hidden="true">
              <o.icon size={16} />
            </span>
          )}
          <span>
            <span className="choice__title">{o.title}</span>
            {o.text && <span className="choice__text">{o.text}</span>}
          </span>
          <span className="choice__check" aria-hidden="true" />
        </label>
      );
    })}
  </fieldset>
);

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Outstanding"];

export const StarInput = ({ value, onChange, label = "Rating" }) => (
  <div className="stars" role="radiogroup" aria-label={label}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}, ${RATING_WORDS[n]}`}
        className={`stars__btn ${value >= n ? "is-on" : ""}`}
        onClick={() => onChange(n)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(5, (value || 0) + 1));
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(1, (value || 1) - 1));
          }
        }}
        tabIndex={value ? (value === n ? 0 : -1) : n === 1 ? 0 : -1}
      >
        <Star size={26} fill={value >= n ? "currentColor" : "none"} strokeWidth={1.6} aria-hidden="true" />
      </button>
    ))}
    <span className="stars__word" aria-live="polite">
      {RATING_WORDS[value] || ""}
    </span>
  </div>
);

/* ---------- Tabs ---------- */

/** Segmented control with a sliding pill. tabs: [{ id, label, count }] */
export const Tabs = ({ tabs, active, onChange, label }) => {
  const group = useId();
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(i + step + tabs.length) % tabs.length];
    onChange(next.id);
    e.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus();
  };
  return (
    <div className="segmented" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab={t.id}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`segmented__tab ${isActive ? "is-active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {isActive && (
              <motion.span
                layoutId={`pill-${group}`}
                className="segmented__pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="segmented__label">{t.label}</span>
            {t.count !== undefined && <span className="segmented__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
};
