import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "../lib/auth";

/* ---------- Session ---------- */

const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(getSession);

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("session-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("session-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};

/* ---------- Theme ---------- */

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

const initialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")) }),
    [theme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/* ---------- Toasts ---------- */

const ToastContext = createContext(() => {});

/** const toast = useToast(); toast("Saved"); toast("Failed", "error"); */
export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, tone = "success") => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span>{t.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const AppProviders = ({ children }) => (
  <ThemeProvider>
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  </ThemeProvider>
);
