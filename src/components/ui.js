import React from "react";
import { normStatus } from "../lib/format";

export const Spinner = ({ label = "Loading…" }) => (
  <div className="loading" role="status">
    <span className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {subtitle && <p className="page-header__sub">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </header>
);

export const Alert = ({ tone = "error", children, onClose }) =>
  children ? (
    <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  ) : null;

export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="empty">
    {Icon && (
      <span className="empty__icon">
        <Icon size={22} aria-hidden="true" />
      </span>
    )}
    <p className="empty__title">{title}</p>
    {children && <p className="empty__text">{children}</p>}
    {action}
  </div>
);

const STATUS_TONES = { PENDING: "warning", ACCEPTED: "info", COMPLETED: "success" };

export const StatusBadge = ({ status }) => {
  const s = normStatus(status);
  return <span className={`badge badge--${STATUS_TONES[s] || "neutral"}`}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>;
};

const URGENCY_TONES = { High: "danger", Medium: "warning", Low: "neutral" };

export const UrgencyBadge = ({ urgency }) =>
  urgency ? <span className={`badge badge--${URGENCY_TONES[urgency] || "neutral"}`}>{urgency} urgency</span> : null;

/** Label + control + error/hint, wired together for screen readers. */
export const Field = ({ label, htmlFor, error, hint, children, className = "" }) => (
  <div className={`field ${error ? "field--invalid" : ""} ${className}`}>
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {error ? (
      <p className="field__error" id={`${htmlFor}-error`}>
        {error}
      </p>
    ) : (
      hint && <p className="field__hint">{hint}</p>
    )}
  </div>
);

export const Tabs = ({ tabs, active, onChange, label }) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((t) => (
      <button
        key={t.id}
        type="button"
        role="tab"
        aria-selected={active === t.id}
        className={`tabs__tab ${active === t.id ? "is-active" : ""}`}
        onClick={() => onChange(t.id)}
      >
        {t.label}
        {t.count !== undefined && <span className="tabs__count">{t.count}</span>}
      </button>
    ))}
  </div>
);

/** Progress bar for "3 of 5 spots filled". */
export const Capacity = ({ taken, limit }) => {
  const safeLimit = Math.max(1, limit || 1);
  const pct = Math.min(100, Math.round((taken / safeLimit) * 100));
  const full = taken >= safeLimit;
  return (
    <div className="capacity">
      <div className="capacity__bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} className={full ? "is-full" : ""} />
      </div>
      <span className="capacity__label">
        {full ? "Full" : `${safeLimit - taken} of ${safeLimit} spots left`}
      </span>
    </div>
  );
};
