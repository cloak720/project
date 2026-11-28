import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import api from "../lib/api";
import { expireSession, getSession } from "../lib/auth";

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

  // If the server no longer recognises our cookie, stop pretending we're signed in.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err.config?.url || "";
        if (err.response?.status === 401 && getSession() && !url.includes("/user/login")) expireSession();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};

/* ---------- Theme ---------- */

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

const readTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be blocked; fall back to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#16120f" : "#f5efe3");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Not fatal: the theme simply won't persist.
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")) }), [theme]);
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
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === "error" ? 6500 : 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === "error" ? <AlertCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <span>{t.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ---------- Confirm dialog ---------- */

const ConfirmContext = createContext(() => Promise.resolve(false));

/**
 * const confirm = useConfirm();
 * if (await confirm({ title, body, confirmLabel, tone: "danger" })) { ... }
 * Uses a native <dialog>, so focus is trapped and Escape cancels for free.
 */
export const useConfirm = () => useContext(ConfirmContext);

const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const dialogRef = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (request && dialog && !dialog.open) dialog.showModal();
  }, [request]);

  const settle = (answer) => {
    request?.resolve(answer);
    dialogRef.current?.close();
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        onClick={(e) => e.target === dialogRef.current && settle(false)}
      >
        {request && (
          <>
            <div className="dialog__body">
              {request.kicker && <p className="kicker">{request.kicker}</p>}
              <h2 id="confirm-title">{request.title}</h2>
              <div id="confirm-body">{typeof request.body === "string" ? <p>{request.body}</p> : request.body}</div>
            </div>
            <div className="dialog__actions">
              <button type="button" className="btn btn--ghost" onClick={() => settle(false)} autoFocus>
                {request.cancelLabel || "Not now"}
              </button>
              <button
                type="button"
                className={`btn ${request.tone === "danger" ? "btn--danger-solid" : "btn--primary"}`}
                onClick={() => settle(true)}
              >
                {request.confirmLabel || "Confirm"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
};

export const AppProviders = ({ children }) => (
  <ThemeProvider>
    <SessionProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </SessionProvider>
  </ThemeProvider>
);
