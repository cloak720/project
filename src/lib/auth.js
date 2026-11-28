import api from "./api";

export const ROLES = { ADMIN: 0, USER: 1, VOLUNTEER: 2 };

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.USER]: "Resident",
  [ROLES.VOLUNTEER]: "Volunteer",
};

const KEYS = ["userId", "role", "userEmail", "userName", "userLastName"];
const EXPIRED_KEY = "sessionExpired";

/** Current session from sessionStorage, or null when nobody is logged in. */
export const getSession = () => {
  const userId = sessionStorage.getItem("userId");
  const role = sessionStorage.getItem("role");
  if (!userId || role === null) return null;
  return {
    userId,
    role: Number(role),
    email: sessionStorage.getItem("userEmail") || "",
    firstName: sessionStorage.getItem("userName") || "",
    lastName: sessionStorage.getItem("userLastName") || "",
  };
};

const notify = () => window.dispatchEvent(new Event("session-change"));

export const saveSession = ({ userId, role, email, firstName, lastName }) => {
  sessionStorage.setItem("userId", String(userId));
  sessionStorage.setItem("role", String(role));
  sessionStorage.setItem("userEmail", email || "");
  sessionStorage.setItem("userName", firstName || "");
  sessionStorage.setItem("userLastName", lastName || "");
  sessionStorage.removeItem(EXPIRED_KEY);
  notify();
};

export const updateSession = (patch) => {
  if (patch.email !== undefined) sessionStorage.setItem("userEmail", patch.email);
  if (patch.firstName !== undefined) sessionStorage.setItem("userName", patch.firstName);
  if (patch.lastName !== undefined) sessionStorage.setItem("userLastName", patch.lastName);
  notify();
};

export const clearSession = () => {
  KEYS.forEach((k) => sessionStorage.removeItem(k));
  notify();
};

/** The server forgot us (restart, timeout): drop local state and tell the login page why. */
export const expireSession = () => {
  sessionStorage.setItem(EXPIRED_KEY, "1");
  clearSession();
};

/** True once after an expiry, so the login page can explain what happened. */
export const consumeSessionExpired = () => {
  const expired = sessionStorage.getItem(EXPIRED_KEY) === "1";
  sessionStorage.removeItem(EXPIRED_KEY);
  return expired;
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
  if (role === ROLES.ADMIN) return "/admin-dashboard";
  if (role === ROLES.VOLUNTEER) return "/volunteer-home";
  return "/";
};
