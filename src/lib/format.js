export const CATEGORIES = ["Medical", "Household", "Transport", "Groceries", "Companionship", "Other"];
export const OPPORTUNITY_CATEGORIES = ["Community", "Environment", "Education", "Elderly care", "Food drive", "Other"];
export const URGENCY_ORDER = { High: 0, Medium: 1, Low: 2 };

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value, fallback = "No deadline") => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : fallback;
};

export const formatDateTime = (value, fallback = "Not specified") => {
  const d = toDate(value);
  return d
    ? d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : fallback;
};

/** "in 3 days", "2 days ago", "today". */
export const relativeDays = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - start) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

export const isPast = (value) => {
  const d = toDate(value);
  return d ? d.getTime() < Date.now() : false;
};

/** Value for <input type="datetime-local"> in local time, e.g. 2026-11-27T14:30. */
export const toLocalInput = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const nowLocalInput = () => toLocalInput(new Date());

export const fullName = (person, fallback = "Unknown") =>
  person ? [person.firstName, person.lastName].filter(Boolean).join(" ") || fallback : fallback;

export const initials = (person) =>
  ((person?.firstName?.[0] || "") + (person?.lastName?.[0] || "")).toUpperCase() || "?";

export const normStatus = (s) => (s || "PENDING").toUpperCase();
