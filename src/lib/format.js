export const REQUEST_CATEGORIES = ["Groceries", "Medical", "Transport", "Household", "Companionship", "Other"];
export const OPPORTUNITY_CATEGORIES = ["Community", "Environment", "Education", "Elderly care", "Food drive", "Other"];
export const URGENCIES = ["High", "Medium", "Low"];
export const URGENCY_ORDER = { High: 0, Medium: 1, Low: 2 };
export const URGENCY_LEVEL = { High: 3, Medium: 2, Low: 1 };

const DAY = 86400000;

export const toDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value, fallback = "No date") => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : fallback;
};

export const formatDateTime = (value, fallback = "Not set") => {
  const d = toDate(value);
  return d
    ? d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : fallback;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** "today", "tomorrow", "in 3 days", "2 days ago". */
export const relativeDays = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

/** Short countdown for deadlines: "45m left", "3h left", "2d left", "Overdue". */
export const timeLeft = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "Overdue";
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))}m left`;
  if (h < 48) return `${h}h left`;
  return `${Math.round(h / 24)}d left`;
};

export const isPast = (value) => {
  const d = toDate(value);
  return d ? d.getTime() < Date.now() : false;
};

/** Comparator for sorting by a date field, soonest first; missing dates go last. */
export const byDate = (key) => (a, b) =>
  (toDate(a[key])?.getTime() ?? Infinity) - (toDate(b[key])?.getTime() ?? Infinity);

const pad = (n) => String(n).padStart(2, "0");

/** Value for <input type="datetime-local"> in local time, e.g. 2026-11-27T14:30. */
export const toLocalInput = (value) => {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const nowLocalInput = () => toLocalInput(new Date());

export const fullName = (person, fallback = "Unknown") =>
  person ? [person.firstName, person.lastName].filter(Boolean).join(" ") || fallback : fallback;

export const initials = (person) =>
  ((person?.firstName?.[0] || "") + (person?.lastName?.[0] || "")).toUpperCase() || "?";

/** Stable hue per person so their avatar is the same colour everywhere. */
export const hueFor = (seed) => {
  const s = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return (h + 230) % 360;
};

export const normStatus = (s) => (s || "PENDING").toUpperCase();

export const STATUS_LABELS = { PENDING: "Open", ACCEPTED: "In progress", COMPLETED: "Completed" };

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Case-insensitive "does any of these fields contain the query". An empty query matches everything. */
export const matches = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.filter(Boolean).join(" ").toLowerCase().includes(q);
};

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
