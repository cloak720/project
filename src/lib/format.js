export const CATEGORIES = ["Groceries", "Medical", "Transport", "Household", "Companionship", "Other"];
export const OPPORTUNITY_CATEGORIES = ["Community", "Environment", "Education", "Elderly care", "Food drive", "Other"];
export const URGENCY_ORDER = { High: 0, Medium: 1, Low: 2 };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses API dates. Opportunity dates come back from Spring as plain "YYYY-MM-DD"; those are
 * calendar days, so they are read in local time (new Date("2026-12-01") would be UTC midnight
 * and show as the previous day west of Greenwich).
 */
export const toDate = (value) => {
  if (!value) return null;
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isDateOnly = (value) => typeof value === "string" && DATE_ONLY.test(value);

export const formatDate = (value, fallback = "No date set") => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : fallback;
};

export const formatDateTime = (value, fallback = "Not specified") => {
  const d = toDate(value);
  if (!d) return fallback;
  if (isDateOnly(value)) return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

/** Pieces for a calendar-style date block: { day: "27", month: "Nov", weekday: "Fri" }. */
export const dateParts = (value) => {
  const d = toDate(value);
  if (!d) return null;
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(undefined, { month: "short" }),
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    time: isDateOnly(value) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** "in 3 days", "2 days ago", "today". */
export const relativeDays = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

/** Whole days from today until the date (negative when it has passed). */
export const daysUntil = (value) => {
  const d = toDate(value);
  return d ? Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000) : null;
};

/** A date-only value lasts the whole day; a timestamp is past the moment it ticks by. */
export const isPast = (value) => {
  const d = toDate(value);
  if (!d) return false;
  if (isDateOnly(value)) d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
};

const pad = (n) => String(n).padStart(2, "0");

/** Value for <input type="datetime-local"> in local time, e.g. 2026-11-27T14:30. */
export const toLocalInput = (value) => {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Value for <input type="date">, e.g. 2026-11-27. */
export const toDateInput = (value) => {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
};

export const nowLocalInput = () => toLocalInput(new Date());

export const addDays = (days, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (hour !== undefined) d.setHours(hour, 0, 0, 0);
  return d;
};

export const fullName = (person, fallback = "Unknown") =>
  person ? [person.firstName, person.lastName].filter(Boolean).join(" ") || fallback : fallback;

export const initials = (person) =>
  ((person?.firstName?.[0] || "") + (person?.lastName?.[0] || "")).toUpperCase() || "?";

export const normStatus = (s) => (s || "PENDING").toUpperCase();

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const greeting = (date = new Date()) => {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** The masthead dateline, e.g. "Friday, 27 November 2026". */
export const longDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
