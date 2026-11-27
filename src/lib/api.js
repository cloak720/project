import axios from "axios";

// One configured client for the whole app. Override the backend location with
// REACT_APP_API_URL (e.g. in a .env.local file) instead of editing every component.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
  withCredentials: true,
});

/** Turn any axios error into a short message a person can read. */
export const errorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (!err.response) return "Can't reach the server. Check that the backend is running.";
  const data = err.response.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data.message === "string") return data.message;
  if (err.response.status === 401) return "Your session has expired. Please log in again.";
  if (err.response.status === 403) return "You don't have permission to do that.";
  return fallback;
};

export default api;
