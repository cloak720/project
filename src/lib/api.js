import axios from "axios";

// One configured client for the whole app. Point it at another backend with
// REACT_APP_API_URL (e.g. in .env.local) instead of editing components.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
  withCredentials: true,
});

/** GET that always resolves to an array, so list screens never have to guard against odd payloads. */
export const getList = (url) => api.get(url).then((r) => (Array.isArray(r.data) ? r.data : []));

/** Turn any axios error into a short message a person can read. */
export const errorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (!err.response) return "We can't reach the NeighborAid server right now. Check your connection and try again.";
  const data = err.response.data;
  if (typeof data === "string" && data.trim() && data.length < 300) return data;
  if (data && typeof data.message === "string" && data.message.trim()) return data.message;
  if (err.response.status === 401) return "Your session has ended. Please log in again.";
  if (err.response.status === 403) return "You don't have permission to do that.";
  if (err.response.status === 404) return "That item no longer exists. It may have been removed.";
  return fallback;
};

export default api;
