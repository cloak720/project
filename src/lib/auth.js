import api from "./api";

export const ROLES = { ADMIN: 0, USER: 1, VOLUNTEER: 2 };

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.USER]: "Resident",
  [ROLES.VOLUNTEER]: "Volunteer",
};

const KEYS = ["userId", "role", "userEmail", "userName", "userLastName"];

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

export const saveSession = ({ userId, role, email, firstName, lastName }) => {
  sessionStorage.setItem("userId", String(userId));
  sessionStorage.setItem("role", String(role));
  sessionStorage.setItem("userEmail", email || "");
  sessionStorage.setItem("userName", firstName || "");
  sessionStorage.setItem("userLastName", lastName || "");
  window.dispatchEvent(new Event("session-change"));
};

export const updateSession = (patch) => {
  if (patch.email !== undefined) sessionStorage.setItem("userEmail", patch.email);
  if (patch.firstName !== undefined) sessionStorage.setItem("userName", patch.firstName);
  if (patch.lastName !== undefined) sessionStorage.setItem("userLastName", patch.lastName);
  window.dispatchEvent(new Event("session-change"));
};

export const clearSession = () => {
  KEYS.forEach((k) => sessionStorage.removeItem(k));
  window.dispatchEvent(new Event("session-change"));
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
