import api from "./api";

export const ROLES = { ADMIN: 0, RESIDENT: 1, VOLUNTEER: 2 };

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.RESIDENT]: "Resident",
  [ROLES.VOLUNTEER]: "Volunteer",
};

const STORE = sessionStorage;
const KEYS = {
  userId: "na.userId",
  role: "na.role",
  email: "na.email",
  firstName: "na.firstName",
  lastName: "na.lastName",
};

export const SESSION_EVENT = "na:session";

const emit = () => window.dispatchEvent(new Event(SESSION_EVENT));

/** The signed-in person (from this tab's storage), or null. The server session cookie is the real authority. */
export const getSession = () => {
  const userId = STORE.getItem(KEYS.userId);
  const role = STORE.getItem(KEYS.role);
  if (!userId || role === null) return null;
  return {
    userId: Number(userId),
    role: Number(role),
    email: STORE.getItem(KEYS.email) || "",
    firstName: STORE.getItem(KEYS.firstName) || "",
    lastName: STORE.getItem(KEYS.lastName) || "",
  };
};

export const saveSession = ({ userId, role, email, firstName, lastName }) => {
  STORE.setItem(KEYS.userId, String(userId));
  STORE.setItem(KEYS.role, String(role));
  STORE.setItem(KEYS.email, email || "");
  STORE.setItem(KEYS.firstName, firstName || "");
  STORE.setItem(KEYS.lastName, lastName || "");
  emit();
};

export const updateSession = (patch) => {
  ["email", "firstName", "lastName"].forEach((k) => {
    if (patch[k] !== undefined) STORE.setItem(KEYS[k], patch[k]);
  });
  emit();
};

export const clearSession = () => {
  Object.values(KEYS).forEach((k) => STORE.removeItem(k));
  emit();
};

/** Ends the server session too; local state is cleared even if the call fails. */
export const logout = async () => {
  try {
    await api.post("/user/logout");
  } catch {
    // The server session may already be gone; nothing else to do.
  } finally {
    clearSession();
  }
};

export const homePathFor = (role) => {
  if (role === ROLES.ADMIN) return "/admin";
  if (role === ROLES.VOLUNTEER) return "/board";
  return "/home";
};
