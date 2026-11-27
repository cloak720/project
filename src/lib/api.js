import axios from "axios";

// One configured client for the whole app. Point it at another backend with REACT_APP_API_URL.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
  withCredentials: true,
});

export const UNAUTHORIZED_EVENT = "na:unauthorized";

// A 401 on anything except the login call means the server session is gone (expired or restarted).
// The session provider listens for this and signs the person out locally.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && !url.includes("/user/login")) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

/** Turn any axios error into a short message a person can read. */
export const errorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (!err.response) return "Can't reach the server. Check your connection and try again.";
  const data = err.response.data;
  if (typeof data === "string" && data.trim() && data.length < 300 && !data.trim().startsWith("<")) return data;
  if (data && typeof data.message === "string" && data.message.trim()) return data.message;
  if (err.response.status === 401) return "Your session has expired. Please log in again.";
  if (err.response.status === 403) return "You don't have permission to do that.";
  if (err.response.status === 404) return "That item no longer exists.";
  return fallback;
};

/** GET that always resolves to an array (empty when the payload isn't one). */
export const getList = (url) => api.get(url).then((r) => (Array.isArray(r.data) ? r.data : []));

export default api;
